#!/usr/bin/env python3
"""
Tailscale Local Log Agent
Tails /var/log/tailscale/tailscaled.log and sends to backend
"""

import os
import sys
import json
import time
import re
import requests
import logging
from datetime import datetime
from pathlib import Path

# Configuration
LOG_FILE = os.getenv('TAILSCALE_LOG_FILE', '/var/log/tailscale/tailscaled.log')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3001/api/tailscale/agent')
BATCH_SIZE = int(os.getenv('BATCH_SIZE', '10'))
BATCH_TIMEOUT = int(os.getenv('BATCH_TIMEOUT', '5'))
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TailscaleLogAgent:
    def __init__(self, log_file, backend_url):
        self.log_file = log_file
        self.backend_url = backend_url
        self.batch = []
        self.last_batch_time = time.time()
        self.file_handle = None
        self.position = 0

    def connect(self):
        """Connect to log file"""
        try:
            if not os.path.exists(self.log_file):
                logger.error(f"Log file not found: {self.log_file}")
                return False

            self.file_handle = open(self.log_file, 'r')
            # Seek to end of file
            self.file_handle.seek(0, 2)
            self.position = self.file_handle.tell()
            logger.info(f"Connected to {self.log_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            return False

    def parse_log_line(self, line):
        """Parse Tailscale log line"""
        try:
            # Example log format:
            # 2024-01-15T14:32:45.123Z [INFO] tailscaled: peer connected: node_id=123, user=john@example.com
            
            # Extract timestamp
            ts_match = re.search(r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})', line)
            ts = ts_match.group(1) if ts_match else datetime.now().isoformat()

            # Determine event type
            event_type = 'device_updated'
            if 'peer connected' in line:
                event_type = 'peer_connected'
            elif 'peer disconnected' in line:
                event_type = 'peer_disconnected'
            elif 'auth' in line.lower() and 'success' in line.lower():
                event_type = 'auth_success'
            elif 'auth' in line.lower() and 'failed' in line.lower():
                event_type = 'auth_failed'
            elif 'subnet' in line.lower():
                event_type = 'subnet_route_added'
            elif 'exit' in line.lower():
                event_type = 'exit_node_used'

            # Extract node_id
            node_id_match = re.search(r'node_id=(\w+)', line)
            node_id = node_id_match.group(1) if node_id_match else 'unknown'

            # Extract user
            user_match = re.search(r'user=([^\s,]+)', line)
            user = user_match.group(1) if user_match else 'unknown'

            # Extract IPs
            src_match = re.search(r'src=(\d+\.\d+\.\d+\.\d+)', line)
            src = src_match.group(1) if src_match else None

            dst_match = re.search(r'dst=(\d+\.\d+\.\d+\.\d+)', line)
            dst = dst_match.group(1) if dst_match else None

            return {
                'ts': ts,
                'type': event_type,
                'node_id': node_id,
                'user': user,
                'src': src,
                'dst': dst,
                'event': line.strip(),
                'raw': line
            }
        except Exception as e:
            logger.error(f"Failed to parse line: {e}")
            return None

    def read_new_lines(self):
        """Read new lines from log file"""
        try:
            if not self.file_handle:
                return []

            new_lines = []
            current_position = self.file_handle.tell()

            # Check if file was rotated
            if current_position > os.path.getsize(self.log_file):
                logger.info("Log file rotated, reconnecting...")
                self.file_handle.close()
                self.connect()
                return []

            # Read new lines
            for line in self.file_handle:
                parsed = self.parse_log_line(line)
                if parsed:
                    new_lines.append(parsed)

            return new_lines
        except Exception as e:
            logger.error(f"Failed to read lines: {e}")
            return []

    def send_batch(self):
        """Send batch of logs to backend"""
        if not self.batch:
            return True

        try:
            logger.info(f"Sending batch of {len(self.batch)} logs...")
            response = requests.post(
                self.backend_url,
                json=self.batch,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )

            if response.status_code == 200:
                logger.info(f"Successfully sent {len(self.batch)} logs")
                self.batch = []
                self.last_batch_time = time.time()
                return True
            else:
                logger.error(f"Backend error: {response.status_code} - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send batch: {e}")
            return False

    def run(self):
        """Main agent loop"""
        if not self.connect():
            sys.exit(1)

        logger.info("Tailscale Log Agent started")

        try:
            while True:
                # Read new lines
                new_lines = self.read_new_lines()
                self.batch.extend(new_lines)

                # Send batch if full or timeout reached
                if len(self.batch) >= BATCH_SIZE:
                    self.send_batch()
                elif len(self.batch) > 0 and time.time() - self.last_batch_time >= BATCH_TIMEOUT:
                    self.send_batch()

                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            if self.batch:
                self.send_batch()
            if self.file_handle:
                self.file_handle.close()
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            sys.exit(1)


if __name__ == '__main__':
    agent = TailscaleLogAgent(LOG_FILE, BACKEND_URL)
    agent.run()

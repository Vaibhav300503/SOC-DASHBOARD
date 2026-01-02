#!/usr/bin/env python3
"""
Real-time Tailscale Log Streamer
Monitors Tailscale log file and streams to dashboard in real-time
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
import websocket
import threading

# Configuration
LOG_FILE = os.getenv('TAILSCALE_LOG_FILE', '/var/log/tailscale/tailscaled.log')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3001/api/tailscale/agent')
STREAM_URL = os.getenv('STREAM_URL', 'ws://localhost:3001/ws/tailscale')
BATCH_SIZE = int(os.getenv('BATCH_SIZE', '5'))  # Smaller batches for real-time
BATCH_TIMEOUT = int(os.getenv('BATCH_TIMEOUT', '2'))  # Faster sending
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Setup logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TailscaleLiveStreamer:
    def __init__(self, log_file, backend_url):
        self.log_file = log_file
        self.backend_url = backend_url
        self.batch = []
        self.last_batch_time = time.time()
        self.file_handle = None
        self.position = 0
        self.running = False
        self.ws = None

    def connect(self):
        """Connect to log file"""
        try:
            if not os.path.exists(self.log_file):
                logger.error(f"Log file not found: {self.log_file}")
                return False

            self.file_handle = open(self.log_file, 'r')
            # Seek to end of file for live monitoring
            self.file_handle.seek(0, 2)
            self.position = self.file_handle.tell()
            logger.info(f"Connected to {self.log_file} - starting live monitoring")
            return True
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            return False

    def parse_log_line(self, line):
        """Parse Tailscale log line with enhanced detection"""
        try:
            # Enhanced regex patterns for better parsing
            timestamp_match = re.search(r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})', line)
            ts = timestamp_match.group(1) if timestamp_match else datetime.now().isoformat()

            # Enhanced event type detection
            event_type = 'device_updated'
            if 'peer connected' in line.lower():
                event_type = 'peer_connected'
            elif 'peer disconnected' in line.lower():
                event_type = 'peer_disconnected'
            elif 'auth' in line.lower() and 'success' in line.lower():
                event_type = 'auth_success'
            elif 'auth' in line.lower() and ('failed' in line.lower() or 'denied' in line.lower()):
                event_type = 'auth_failed'
            elif 'subnet' in line.lower() and ('route' in line.lower() or 'added' in line.lower()):
                event_type = 'subnet_route_added'
            elif 'exit' in line.lower() and ('node' in line.lower() or 'used' in line.lower()):
                event_type = 'exit_node_used'
            elif 'login' in line.lower():
                event_type = 'user_login'
            elif 'logout' in line.lower():
                event_type = 'user_logout'
            elif 'dns' in line.lower():
                event_type = 'dns_query'

            # Extract node_id with better pattern
            node_id_match = re.search(r'node_id[=:]?(\w+)', line)
            node_id = node_id_match.group(1) if node_id_match else 'unknown'

            # Extract user with better pattern
            user_match = re.search(r'user[=:]?([^\s,]+)', line)
            user = user_match.group(1) if user_match else 'unknown'

            # Extract IPs with better patterns
            src_match = re.search(r'src[=:]?(\d+\.\d+\.\d+\.\d+)', line)
            src = src_match.group(1) if src_match else None

            dst_match = re.search(r'dst[=:]?(\d+\.\d+\.\d+\.\d+)', line)
            dst = dst_match.group(1) if dst_match else None

            # Extract IP addresses more broadly
            ip_matches = re.findall(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', line)
            if not src and ip_matches:
                src = ip_matches[0] if len(ip_matches) > 0 else None
                dst = ip_matches[1] if len(ip_matches) > 1 else None

            return {
                'ts': ts,
                'type': event_type,
                'node_id': node_id,
                'user': user,
                'src': src,
                'dst': dst,
                'event': line.strip(),
                'raw': line,
                'source': 'live_stream'
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
            logger.info(f"📡 Streaming {len(self.batch)} live events...")
            response = requests.post(
                self.backend_url,
                json=self.batch,
                timeout=5,
                headers={'Content-Type': 'application/json'}
            )

            if response.status_code == 200:
                logger.info(f"✅ Successfully streamed {len(self.batch)} events")
                self.batch = []
                self.last_batch_time = time.time()
                return True
            else:
                logger.error(f"❌ Backend error: {response.status_code} - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Failed to stream batch: {e}")
            return False

    def stream_live(self):
        """Main live streaming loop"""
        if not self.connect():
            sys.exit(1)

        logger.info("🚀 Tailscale Live Streamer Started")
        logger.info(f"📁 Monitoring: {self.log_file}")
        logger.info(f"🌐 Streaming to: {self.backend_url}")

        try:
            while self.running:
                # Read new lines
                new_lines = self.read_new_lines()
                
                if new_lines:
                    logger.info(f"📝 Detected {len(new_lines)} new events")
                    self.batch.extend(new_lines)
                    
                    # Send immediately for real-time experience
                    if len(self.batch) >= BATCH_SIZE:
                        self.send_batch()
                    elif len(self.batch) > 0 and time.time() - self.last_batch_time >= BATCH_TIMEOUT:
                        self.send_batch()

                time.sleep(0.5)  # Check every 500ms for real-time
                
        except KeyboardInterrupt:
            logger.info("🛑 Shutting down live streamer...")
            if self.batch:
                self.send_batch()
            if self.file_handle:
                self.file_handle.close()
        except Exception as e:
            logger.error(f"💥 Unexpected error: {e}")
            sys.exit(1)

    def start(self):
        """Start the live streamer"""
        self.running = True
        self.stream_live()

if __name__ == '__main__':
    streamer = TailscaleLiveStreamer(LOG_FILE, BACKEND_URL)
    streamer.start()

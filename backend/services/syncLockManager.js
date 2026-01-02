import Redis from 'ioredis';
import fs from 'fs/promises';
import path from 'path';

class SyncLockManager {
  constructor() {
    this.redis = null;
    this.fileLockPath = path.join(process.cwd(), '.sync-lock');
    this.lockTimeout = 10 * 60 * 1000; // 10 minutes
    this.lockKey = 'tailscale:sync:lock';
    this.initRedis();
  }

  async initRedis() {
    // Disable Redis - use file-based locking only
    console.warn('⚠️  Using file-based locking (Redis disabled)');
    this.redis = null;
  }

  // Acquire sync lock with timeout
  async acquireLock(lockType = 'auto', timeout = this.lockTimeout) {
    const lockId = this.generateLockId();
    const lockData = {
      id: lockId,
      type: lockType,
      timestamp: Date.now(),
      timeout: timeout,
      pid: process.pid
    };

    try {
      if (this.redis) {
        return await this.acquireRedisLock(lockData, timeout);
      } else {
        return await this.acquireFileLock(lockData, timeout);
      }
    } catch (error) {
      console.error('❌ Failed to acquire sync lock:', error);
      throw new Error(`Sync lock acquisition failed: ${error.message}`);
    }
  }

  // Redis-based distributed lock
  async acquireRedisLock(lockData, timeout) {
    const lockValue = JSON.stringify(lockData);
    
    // Use Redis SET with NX and EX for atomic lock acquisition
    const result = await this.redis.set(
      this.lockKey,
      lockValue,
      'PX', // Set expiration in milliseconds
      timeout,
      'NX'  // Only set if key doesn't exist
    );

    if (result === 'OK') {
      console.log(`🔒 Redis lock acquired: ${lockData.id} (${lockData.type})`);
      
      // Start lock renewal heartbeat
      this.startLockHeartbeat(lockData.id, timeout);
      
      return {
        acquired: true,
        lockId: lockData.id,
        method: 'redis'
      };
    } else {
      // Check if existing lock is expired
      const existingLock = await this.redis.get(this.lockKey);
      if (existingLock) {
        const lockInfo = JSON.parse(existingLock);
        const isExpired = (Date.now() - lockInfo.timestamp) > lockInfo.timeout;
        
        if (isExpired) {
          console.log('🔓 Expired lock detected, forcing release...');
          await this.redis.del(this.lockKey);
          return await this.acquireRedisLock(lockData, timeout);
        }
      }
      
      return {
        acquired: false,
        existingLock: existingLock ? JSON.parse(existingLock) : null,
        method: 'redis'
      };
    }
  }

  // File-based lock for single-server environments
  async acquireFileLock(lockData, timeout) {
    try {
      // Check if lock file exists and is valid
      const lockExists = await this.fileExists(this.fileLockPath);
      
      if (lockExists) {
        const existingLockData = await this.readLockFile();
        
        // Check if lock is expired
        const isExpired = (Date.now() - existingLockData.timestamp) > existingLockData.timeout;
        
        if (isExpired) {
          console.log('🔓 Expired file lock detected, removing...');
          await this.releaseFileLock();
        } else {
          return {
            acquired: false,
            existingLock: existingLockData,
            method: 'file'
          };
        }
      }
      
      // Create new lock file
      await fs.writeFile(this.fileLockPath, JSON.stringify(lockData, null, 2));
      
      // Verify lock was created successfully
      const verifyLock = await this.readLockFile();
      if (verifyLock.id === lockData.id) {
        console.log(`🔒 File lock acquired: ${lockData.id} (${lockData.type})`);
        
        // Start lock renewal
        this.startFileLockHeartbeat(lockData.id, timeout);
        
        return {
          acquired: true,
          lockId: lockData.id,
          method: 'file'
        };
      } else {
        throw new Error('Lock file verification failed');
      }
      
    } catch (error) {
      console.error('❌ File lock operation failed:', error);
      throw error;
    }
  }

  // Release sync lock
  async releaseLock(lockId) {
    try {
      if (this.redis) {
        return await this.releaseRedisLock(lockId);
      } else {
        return await this.releaseFileLock(lockId);
      }
    } catch (error) {
      console.error('❌ Failed to release sync lock:', error);
      return false;
    }
  }

  async releaseRedisLock(lockId) {
    const currentLock = await this.redis.get(this.lockKey);
    
    if (currentLock) {
      const lockData = JSON.parse(currentLock);
      
      // Only release if it's our lock
      if (lockData.id === lockId) {
        await this.redis.del(this.lockKey);
        console.log(`🔓 Redis lock released: ${lockId}`);
        this.stopLockHeartbeat(lockId);
        return true;
      } else {
        console.warn(`⚠️  Cannot release lock - not owner. Expected: ${lockId}, Found: ${lockData.id}`);
        return false;
      }
    }
    
    return false;
  }

  async releaseFileLock(lockId) {
    try {
      const lockExists = await this.fileExists(this.fileLockPath);
      
      if (lockExists) {
        const currentLock = await this.readLockFile();
        
        if (currentLock.id === lockId) {
          await fs.unlink(this.fileLockPath);
          console.log(`🔓 File lock released: ${lockId}`);
          this.stopFileLockHeartbeat(lockId);
          return true;
        } else {
          console.warn(`⚠️  Cannot release file lock - not owner. Expected: ${lockId}, Found: ${currentLock.id}`);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ File lock release failed:', error);
      return false;
    }
  }

  // Check current lock status
  async getLockStatus() {
    try {
      if (this.redis) {
        const lockData = await this.redis.get(this.lockKey);
        return lockData ? JSON.parse(lockData) : null;
      } else {
        const lockExists = await this.fileExists(this.fileLockPath);
        return lockExists ? await this.readLockFile() : null;
      }
    } catch (error) {
      console.error('❌ Failed to get lock status:', error);
      return null;
    }
  }

  // Lock heartbeat to prevent expiration
  startLockHeartbeat(lockId, timeout) {
    const heartbeatInterval = Math.floor(timeout / 3); // Renew every 1/3 of timeout
    
    this.heartbeatTimer = setInterval(async () => {
      try {
        if (this.redis) {
          await this.redis.pexpire(this.lockKey, timeout);
        } else {
          // Update file timestamp
          const lockData = await this.readLockFile();
          if (lockData.id === lockId) {
            lockData.timestamp = Date.now();
            await fs.writeFile(this.fileLockPath, JSON.stringify(lockData, null, 2));
          }
        }
      } catch (error) {
        console.error('❌ Lock heartbeat failed:', error);
      }
    }, heartbeatInterval);
  }

  // File-based lock heartbeat functions
  startFileLockHeartbeat(lockId, timeout) {
    this.heartbeatTimer = setInterval(async () => {
      try {
        const lockExists = await this.fileExists(this.fileLockPath);
        if (lockExists) {
          const lockData = await this.readLockFile();
          if (lockData.id === lockId) {
            // Update timestamp to keep lock alive
            lockData.timestamp = Date.now();
            await fs.writeFile(this.fileLockPath, JSON.stringify(lockData, null, 2));
          }
        }
      } catch (error) {
        console.error('Heartbeat update failed:', error);
      }
    }, Math.floor(timeout / 3)); // Update every 1/3 of timeout
  }

  stopFileLockHeartbeat(lockId) {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  stopLockHeartbeat(lockId) {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // File-based lock helpers
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readLockFile() {
    const data = await fs.readFile(this.fileLockPath, 'utf8');
    return JSON.parse(data);
  }

  generateLockId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup on process exit
  async cleanup() {
    const currentLock = await this.getLockStatus();
    if (currentLock && currentLock.pid === process.pid) {
      await this.releaseLock(currentLock.id);
    }
    
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}

// Global lock manager instance
const lockManager = new SyncLockManager();

// Cleanup on process exit
process.on('exit', () => lockManager.cleanup());
process.on('SIGINT', () => lockManager.cleanup());
process.on('SIGTERM', () => lockManager.cleanup());

export default lockManager;

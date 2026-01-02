import lockManager from './syncLockManager.js';
import atomicSyncService from './tailscaleSyncAtomic.js';
import tailscaleService from './tailscale.js';

class LockedTailscaleSyncService {
  constructor() {
    this.currentLock = null;
    this.syncInProgress = false;
  }

  // Protected sync with locking
  async syncDevicesProtected() {
    if (this.syncInProgress) {
      console.log('⚠️  Sync already in progress, skipping...');
      return { success: false, reason: 'Sync already in progress' };
    }

    this.syncInProgress = true;
    
    try {
      // Check current lock status
      const existingLock = await lockManager.getLockStatus();
      if (existingLock) {
        const lockAge = Date.now() - existingLock.timestamp;
        const isExpired = lockAge > existingLock.timeout;
        
        if (!isExpired) {
          console.log(`⚠️  Another sync is running (${existingLock.type} sync, started ${Math.floor(lockAge/1000)}s ago)`);
          return { 
            success: false, 
            reason: 'Another sync in progress',
            existingLock: {
              type: existingLock.type,
              age: Math.floor(lockAge / 1000),
              timeout: existingLock.timeout
            }
          };
        } else {
          console.log('🔓 Expired lock detected, cleaning up...');
          await lockManager.releaseLock(existingLock.id);
        }
      }

      // Acquire new lock
      const lockResult = await lockManager.acquireLock('auto');
      
      if (!lockResult.acquired) {
        return { 
          success: false, 
          reason: 'Failed to acquire lock',
          existingLock: lockResult.existingLock
        };
      }

      this.currentLock = lockResult;
      console.log(`🔒 Sync lock acquired: ${lockResult.lockId}`);

      // Perform the actual sync
      const syncResult = await atomicSyncService.syncDevicesAtomic();
      
      return {
        success: true,
        lockId: lockResult.lockId,
        ...syncResult
      };

    } catch (error) {
      console.error('❌ Protected sync failed:', error);
      return {
        success: false,
        error: error.message,
        lockId: this.currentLock?.lockId
      };
    } finally {
      // Always release the lock
      if (this.currentLock) {
        await lockManager.releaseLock(this.currentLock.lockId);
        console.log(`🔓 Sync lock released: ${this.currentLock.lockId}`);
        this.currentLock = null;
      }
      
      this.syncInProgress = false;
    }
  }

  // Manual sync with higher priority lock
  async manualSync() {
    if (this.syncInProgress) {
      console.log('⚠️  Cannot start manual sync - another sync in progress');
      return { success: false, reason: 'Another sync in progress' };
    }

    this.syncInProgress = true;
    
    try {
      // Try to acquire lock with shorter timeout for manual sync
      const lockResult = await lockManager.acquireLock('manual', 5 * 60 * 1000); // 5 minutes
      
      if (!lockResult.acquired) {
        // For manual sync, we can try to force release if lock is old
        const existingLock = lockResult.existingLock;
        if (existingLock && existingLock.type === 'auto') {
          const lockAge = Date.now() - existingLock.timestamp;
          if (lockAge > 2 * 60 * 1000) { // 2 minutes
            console.log('🔓 Forcing release of old auto-sync for manual sync...');
            await lockManager.releaseLock(existingLock.id);
            const retryResult = await lockManager.acquireLock('manual', 5 * 60 * 1000);
            if (retryResult.acquired) {
              this.currentLock = retryResult;
            } else {
              return { success: false, reason: 'Failed to acquire lock even after force release' };
            }
          } else {
            return { 
              success: false, 
              reason: 'Auto-sync is running, wait or stop it first',
              lockAge: Math.floor(lockAge / 1000)
            };
          }
        } else {
          return { 
            success: false, 
            reason: 'Another manual sync is running',
            existingLock: lockResult.existingLock
          };
        }
      } else {
        this.currentLock = lockResult;
      }

      console.log(`🔒 Manual sync lock acquired: ${this.currentLock.lockId}`);

      // Perform manual sync
      const syncResult = await atomicSyncService.syncDevicesAtomic();
      
      return {
        success: true,
        lockId: this.currentLock.lockId,
        syncType: 'manual',
        ...syncResult
      };

    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      return {
        success: false,
        error: error.message,
        lockId: this.currentLock?.lockId,
        syncType: 'manual'
      };
    } finally {
      if (this.currentLock) {
        await lockManager.releaseLock(this.currentLock.lockId);
        console.log(`🔓 Manual sync lock released: ${this.currentLock.lockId}`);
        this.currentLock = null;
      }
      
      this.syncInProgress = false;
    }
  }

  // Get current sync status
  async getSyncStatus() {
    const lockStatus = await lockManager.getLockStatus();
    
    return {
      syncInProgress: this.syncInProgress,
      currentLock: this.currentLock,
      globalLock: lockStatus,
      lastSyncTime: this.lastSyncTime,
      canStartSync: !this.syncInProgress && !lockStatus
    };
  }

  // Start auto-sync with protection
  startAutoSync(interval = 5 * 60 * 1000) { // 5 minutes default
    console.log('🚀 Starting protected auto-sync service...');
    
    // Initial sync
    this.syncDevicesProtected();
    
    // Set up recurring sync with protection
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncDevicesProtected();
        this.lastSyncTime = new Date();
      } catch (error) {
        console.error('❌ Auto-sync cycle failed:', error);
      }
    }, interval);
    
    console.log(`⏰ Protected auto-sync started (interval: ${interval / 1000} seconds)`);
  }

  // Stop auto-sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️  Auto-sync stopped');
    }
  }

  // Force unlock (emergency use only)
  async forceUnlock() {
    try {
      const lockStatus = await lockManager.getLockStatus();
      if (lockStatus) {
        await lockManager.releaseLock(lockStatus.id);
        console.log(`🔓 Force unlocked: ${lockStatus.id}`);
        return { success: true, unlockedLock: lockStatus };
      } else {
        return { success: false, reason: 'No lock found' };
      }
    } catch (error) {
      console.error('❌ Force unlock failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new LockedTailscaleSyncService();

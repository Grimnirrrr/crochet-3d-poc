// src/utils/recoverySystem.js

/**
 * D0.6: Recovery Fallback Chain
 * Provides multiple layers of recovery for corrupted data and failed operations
 * Part of v7.0 Prevention Layer (Phase 0)
 */

import { safeLocalStorageGet, safeLocalStorageSet } from './safeSerialize';
import { validateAssembly } from './assemblyValidator';

/**
 * Recovery strategies in order of preference
 */
const RECOVERY_STRATEGIES = {
  AUTO_BACKUP: 'auto_backup',
  HISTORY_REBUILD: 'history_rebuild',
  PARTIAL_RESTORE: 'partial_restore',
  CLEAN_SLATE: 'clean_slate'
};

/**
 * Auto-backup manager
 */
class BackupManager {
  constructor(maxBackups = 5) {
    this.maxBackups = maxBackups;
    this.backupPrefix = 'backup_';
  }

  /**
   * Create a backup of assembly data
   */
  createBackup(assemblyId, data) {
    try {
      const timestamp = Date.now();
      const backupKey = `${this.backupPrefix}${assemblyId}_${timestamp}`;
      
      // Store backup
      const backupData = {
        originalId: assemblyId,
        timestamp,
        data,
        version: '7.0',
        reason: 'auto_backup'
      };
      
      const success = safeLocalStorageSet(backupKey, backupData);
      
      if (success) {
        // Manage backup count
        this.pruneOldBackups(assemblyId);
        console.log(`Backup created: ${backupKey}`);
        return backupKey;
      }
      
      return null;
    } catch (error) {
      console.error('Backup creation failed:', error);
      return null;
    }
  }

  /**
   * Get all backups for an assembly
   */
  getBackups(assemblyId) {
    const backups = [];
    const prefix = `${this.backupPrefix}${assemblyId}_`;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const backup = safeLocalStorageGet(key);
          if (backup) {
            backups.push({
              key,
              timestamp: backup.timestamp,
              data: backup.data
            });
          }
        }
      }
      
      // Sort by timestamp (newest first)
      backups.sort((a, b) => b.timestamp - a.timestamp);
      return backups;
    } catch (error) {
      console.error('Failed to retrieve backups:', error);
      return [];
    }
  }

  /**
   * Restore from a specific backup
   */
  restoreFromBackup(backupKey) {
    try {
      const backup = safeLocalStorageGet(backupKey);
      if (backup && backup.data) {
        console.log(`Restoring from backup: ${backupKey}`);
        return backup.data;
      }
      return null;
    } catch (error) {
      console.error('Restore from backup failed:', error);
      return null;
    }
  }

  /**
   * Remove old backups keeping only the most recent ones
   */
  pruneOldBackups(assemblyId) {
    try {
      const backups = this.getBackups(assemblyId);
      
      if (backups.length > this.maxBackups) {
        // Remove oldest backups
        const toRemove = backups.slice(this.maxBackups);
        toRemove.forEach(backup => {
          localStorage.removeItem(backup.key);
          console.log(`Pruned old backup: ${backup.key}`);
        });
      }
    } catch (error) {
      console.error('Failed to prune backups:', error);
    }
  }

  /**
   * Clear all backups for an assembly
   */
  clearBackups(assemblyId) {
    const backups = this.getBackups(assemblyId);
    backups.forEach(backup => {
      localStorage.removeItem(backup.key);
    });
    console.log(`Cleared ${backups.length} backups for assembly ${assemblyId}`);
  }
}

/**
 * Recovery system main class
 */
export class RecoverySystem {
  constructor() {
    this.backupManager = new BackupManager();
    this.recoveryLog = [];
  }

  /**
   * Attempt to recover an assembly using fallback chain
   */
  async recoverAssembly(assemblyId, options = {}) {
    console.log(`Starting recovery for assembly: ${assemblyId}`);
    
    const recoveryAttempts = [];
    let recovered = null;

    // Strategy 1: Try loading the original
    if (!options.skipOriginal) {
      recovered = this.tryLoadOriginal(assemblyId);
      if (recovered) {
        recoveryAttempts.push({
          strategy: 'ORIGINAL',
          success: true,
          data: recovered
        });
        return this.finalizeRecovery(recovered, recoveryAttempts);
      }
    }

    // Strategy 2: Try auto-backup
    recovered = this.tryAutoBackup(assemblyId);
    if (recovered) {
      recoveryAttempts.push({
        strategy: RECOVERY_STRATEGIES.AUTO_BACKUP,
        success: true,
        data: recovered
      });
      return this.finalizeRecovery(recovered, recoveryAttempts);
    }

    // Strategy 3: Try rebuilding from history
    recovered = this.tryHistoryRebuild(assemblyId);
    if (recovered) {
      recoveryAttempts.push({
        strategy: RECOVERY_STRATEGIES.HISTORY_REBUILD,
        success: true,
        data: recovered
      });
      return this.finalizeRecovery(recovered, recoveryAttempts);
    }

    // Strategy 4: Try partial restore
    recovered = this.tryPartialRestore(assemblyId);
    if (recovered) {
      recoveryAttempts.push({
        strategy: RECOVERY_STRATEGIES.PARTIAL_RESTORE,
        success: true,
        data: recovered
      });
      return this.finalizeRecovery(recovered, recoveryAttempts);
    }

    // Strategy 5: Clean slate
    if (options.allowCleanSlate) {
      recovered = this.createCleanSlate(assemblyId);
      recoveryAttempts.push({
        strategy: RECOVERY_STRATEGIES.CLEAN_SLATE,
        success: true,
        data: recovered
      });
      return this.finalizeRecovery(recovered, recoveryAttempts);
    }

    // Recovery failed
    this.logRecovery(assemblyId, 'FAILED', recoveryAttempts);
    return {
      success: false,
      attempts: recoveryAttempts,
      error: 'All recovery strategies failed'
    };
  }

  /**
   * Try loading the original assembly
   */
  tryLoadOriginal(assemblyId) {
    try {
      const data = safeLocalStorageGet(`assembly_${assemblyId}`);
      if (data && this.validateData(data)) {
        console.log('Original data loaded successfully');
        return data;
      }
    } catch (error) {
      console.error('Original load failed:', error);
    }
    return null;
  }

  /**
   * Try restoring from auto-backup
   */
  tryAutoBackup(assemblyId) {
    try {
      const backups = this.backupManager.getBackups(assemblyId);
      
      for (const backup of backups) {
        const data = this.backupManager.restoreFromBackup(backup.key);
        if (data && this.validateData(data)) {
          console.log(`Restored from backup: ${backup.key}`);
          return data;
        }
      }
    } catch (error) {
      console.error('Auto-backup restore failed:', error);
    }
    return null;
  }

  /**
   * Try rebuilding from history
   */
  tryHistoryRebuild(assemblyId) {
    try {
      // Look for any data with history
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(assemblyId)) {
          keys.push(key);
        }
      }

      for (const key of keys) {
        const data = safeLocalStorageGet(key);
        if (data && data.history && data.history.length > 0) {
          // Rebuild from history
          const rebuilt = this.rebuildFromHistory(data.history, assemblyId);
          if (rebuilt && this.validateData(rebuilt)) {
            console.log('Rebuilt from history');
            return rebuilt;
          }
        }
      }
    } catch (error) {
      console.error('History rebuild failed:', error);
    }
    return null;
  }

  /**
   * Rebuild assembly from history actions
   */
  rebuildFromHistory(history, assemblyId) {
    try {
      const rebuilt = {
        id: assemblyId,
        name: 'Recovered Assembly',
        pieces: [],
        connections: [],
        history: history,
        locked: [],
        recovered: true,
        recoveryTimestamp: Date.now()
      };

      // Replay history to rebuild state
      history.forEach(action => {
        switch (action.action) {
          case 'add_piece':
            if (action.pieceId && !rebuilt.pieces.find(p => p.id === action.pieceId)) {
              rebuilt.pieces.push({
                id: action.pieceId,
                name: action.pieceName || 'Recovered Piece',
                recovered: true
              });
            }
            break;
          
          case 'connect':
            if (action.data) {
              rebuilt.connections.push({
                piece1Id: action.data.piece1Id,
                piece2Id: action.data.piece2Id,
                point1Id: action.data.point1Id,
                point2Id: action.data.point2Id,
                recovered: true
              });
            }
            break;
          
          case 'remove_piece':
            rebuilt.pieces = rebuilt.pieces.filter(p => p.id !== action.pieceId);
            rebuilt.connections = rebuilt.connections.filter(
              c => c.piece1Id !== action.pieceId && c.piece2Id !== action.pieceId
            );
            break;
        }
      });

      return rebuilt;
    } catch (error) {
      console.error('History rebuild process failed:', error);
      return null;
    }
  }

  /**
   * Try partial restore (salvage what's possible)
   */
  tryPartialRestore(assemblyId) {
    try {
      const data = safeLocalStorageGet(`assembly_${assemblyId}`);
      if (!data) return null;

      const partial = {
        id: assemblyId,
        name: data.name || 'Partially Recovered',
        pieces: [],
        connections: [],
        history: [],
        locked: [],
        partial: true,
        recoveryTimestamp: Date.now()
      };

      // Try to salvage pieces
      if (data.pieces) {
        if (Array.isArray(data.pieces)) {
          partial.pieces = data.pieces.filter(p => p && p.id);
        } else if (typeof data.pieces === 'object') {
          Object.values(data.pieces).forEach(piece => {
            if (piece && piece.id) {
              partial.pieces.push(piece);
            }
          });
        }
      }

      // Try to salvage connections
      if (Array.isArray(data.connections)) {
        partial.connections = data.connections.filter(c => 
          c && c.piece1Id && c.piece2Id
        );
      }

      // Try to salvage history
      if (Array.isArray(data.history)) {
        partial.history = data.history.filter(h => h && h.action);
      }

      // Only return if we salvaged something
      if (partial.pieces.length > 0 || partial.history.length > 0) {
        console.log(`Partial restore: ${partial.pieces.length} pieces, ${partial.history.length} history items`);
        return partial;
      }
    } catch (error) {
      console.error('Partial restore failed:', error);
    }
    return null;
  }

  /**
   * Create a clean slate assembly
   */
  createCleanSlate(assemblyId) {
    console.log('Creating clean slate assembly');
    return {
      id: assemblyId,
      name: 'New Assembly (Recovered)',
      pieces: [],
      connections: [],
      history: [{
        action: 'recovery',
        strategy: RECOVERY_STRATEGIES.CLEAN_SLATE,
        timestamp: Date.now()
      }],
      locked: [],
      cleanSlate: true,
      recoveryTimestamp: Date.now()
    };
  }

  /**
   * Validate recovered data
   */
  validateData(data) {
    try {
      // Basic structure check
      if (!data || typeof data !== 'object') return false;
      if (!data.id) return false;

      // Check for critical fields
      const hasValidStructure = 
        (Array.isArray(data.pieces) || typeof data.pieces === 'object') &&
        (Array.isArray(data.connections) || data.connections === undefined);

      return hasValidStructure;
    } catch (error) {
      console.error('Data validation failed:', error);
      return false;
    }
  }

  /**
   * Finalize recovery process
   */
  finalizeRecovery(data, attempts) {
    // Add recovery metadata
    data.recoveryInfo = {
      recovered: true,
      timestamp: Date.now(),
      attempts: attempts.length,
      finalStrategy: attempts[attempts.length - 1].strategy
    };

    // Create new backup of recovered data
    this.backupManager.createBackup(data.id, data);

    // Log recovery
    this.logRecovery(data.id, 'SUCCESS', attempts);

    return {
      success: true,
      data,
      attempts,
      message: `Recovery successful using ${data.recoveryInfo.finalStrategy}`
    };
  }

  /**
   * Log recovery attempt
   */
  logRecovery(assemblyId, status, attempts) {
    const logEntry = {
      assemblyId,
      status,
      attempts: attempts.length,
      strategies: attempts.map(a => a.strategy),
      timestamp: Date.now()
    };

    this.recoveryLog.push(logEntry);
    console.log('Recovery log:', logEntry);

    // Keep log size manageable
    if (this.recoveryLog.length > 100) {
      this.recoveryLog = this.recoveryLog.slice(-100);
    }
  }

  /**
   * Create backup before risky operation
   */
  createSafetyBackup(assemblyId, data, reason = 'safety') {
    const backupKey = this.backupManager.createBackup(assemblyId, data);
    
    if (backupKey) {
      console.log(`Safety backup created: ${reason}`);
      return {
        success: true,
        backupKey,
        restore: () => this.backupManager.restoreFromBackup(backupKey)
      };
    }

    return { success: false };
  }

  /**
   * Get recovery status and statistics
   */
  getRecoveryStats() {
    const stats = {
      totalAttempts: this.recoveryLog.length,
      successful: this.recoveryLog.filter(l => l.status === 'SUCCESS').length,
      failed: this.recoveryLog.filter(l => l.status === 'FAILED').length,
      recentLogs: this.recoveryLog.slice(-10)
    };

    return stats;
  }

  /**
   * Clear all recovery data for an assembly
   */
  clearRecoveryData(assemblyId) {
    this.backupManager.clearBackups(assemblyId);
    this.recoveryLog = this.recoveryLog.filter(l => l.assemblyId !== assemblyId);
    console.log(`Cleared all recovery data for ${assemblyId}`);
  }
}

// Export singleton instance
export const recoverySystem = new RecoverySystem();

// Export recovery utilities
export function createSafetyBackup(assemblyId, data, reason) {
  return recoverySystem.createSafetyBackup(assemblyId, data, reason);
}

export function recoverAssembly(assemblyId, options) {
  return recoverySystem.recoverAssembly(assemblyId, options);
}

export function getRecoveryStats() {
  return recoverySystem.getRecoveryStats();
}
// src/types/assemblyModels.js
import { toSafeVector3, toSafeColor, createSafePieceData } from '../utils/safeTypes';
import { safeLocalStorageSet, safeLocalStorageGet } from '../utils/safeSerialize';
import { isValidConnection, validateAssembly } from '../utils/assemblyValidator';
import { 
  guardedAddPiece, 
  guardedConnect, 
  guardedSave,
  getUsageTracker,
  checkLimits,
  getUpgradePrompt,
  resetUsageTracker
} from '../utils/tierEnforcement';
import { 
  createSafetyBackup, 
  recoverAssembly, 
  recoverySystem 
} from '../utils/recoverySystem';

/**
 * CrochetPiece class - represents a modular piece
 */
export class CrochetPiece {
  constructor(data) {
    this.id = data.id || `piece-${Date.now()}`;
    this.name = data.name || 'Unnamed Piece';
    this.type = data.type || 'custom'; // head, body, arm, leg, etc.
    this.rounds = data.rounds || [];
    this.color = toSafeColor(data.color);
    this.mesh = null; // THREE.Group - never saved
    this.connectionPoints = data.connectionPoints || [];
    this.isCustom = data.isCustom || false; // Track if this is a custom piece
    this.metadata = {
      stitchCount: data.stitchCount || 0,
      roundCount: data.roundCount || 0,
      createdAt: Date.now()
    };
  }
  
  // Add connection point
  addConnectionPoint(name, position, compatible = []) {
    const point = {
      id: `${this.id}-${name}`,
      name,
      position: toSafeVector3(position),
      compatible,
      isOccupied: false,
      pieceId: this.id
    };
    this.connectionPoints.push(point);
    return point;
  }
  
  // Get safe data for saving (no Three.js refs)
  toSafeData() {
    return createSafePieceData(this);
  }
}

/**
 * Assembly class - manages connected pieces with tier enforcement and recovery
 */
export class Assembly {
  constructor(tier = 'freemium') {
    this.id = `assembly-${Date.now()}`;
    this.name = 'New Assembly';
    this.pieces = new Map();
    this.connections = [];
    this.history = [];
    this.locked = new Set();
    this.currentTier = tier;
    this.usageTracker = getUsageTracker(tier);
  }
  
  // Validation method
  canConnect(piece1Id, point1Id, piece2Id, point2Id) {
    const piece1 = this.pieces.get(piece1Id);
    const piece2 = this.pieces.get(piece2Id);
    
    if (!piece1 || !piece2) {
      return { valid: false, reason: 'Piece not found' };
    }
    
    const point1 = piece1.connectionPoints.find(p => p.id === point1Id);
    const point2 = piece2.connectionPoints.find(p => p.id === point2Id);
    
    return isValidConnection(point1, point2, this.pieces);
  }
  
  // Validate assembly
  validate() {
    return validateAssembly(this);
  }
  
  // Add piece with tier enforcement
  addPiece(piece) {
    if (!(piece instanceof CrochetPiece)) {
      console.error('Must be a CrochetPiece instance');
      return { success: false, reason: 'INVALID_PIECE_TYPE' };
    }
    
    if (this.locked.has(piece.id)) {
      console.warn('Piece is locked');
      return { success: false, reason: 'PIECE_LOCKED' };
    }
    
    const result = guardedAddPiece(this, piece, this.currentTier);
    
    if (!result.success) {
      console.warn('Failed to add piece:', result.reason, result.message);
      
      if (result.showUpgrade) {
        const prompt = getUpgradePrompt(this.currentTier, 'ADD_PIECE');
        return { ...result, upgradePrompt: prompt };
      }
      
      return result;
    }
    
    return result;
  }
  
  // Direct add piece method (called by guardedAddPiece internally)
  _directAddPiece(piece) {
    this.pieces.set(piece.id, piece);
    this.history.push({
      action: 'add_piece',
      pieceId: piece.id,
      timestamp: Date.now()
    });
    return true;
  }
  
  // Connect with tier enforcement
  connect(piece1Id, point1Id, piece2Id, point2Id) {
    if (this.locked.has(piece1Id) || this.locked.has(piece2Id)) {
      console.warn('One or both pieces are locked');
      return { success: false, reason: 'PIECES_LOCKED' };
    }
    
    const result = guardedConnect(
      this,
      piece1Id,
      point1Id,
      piece2Id,
      point2Id,
      (p1Id, pt1Id, p2Id, pt2Id) => this.canConnect(p1Id, pt1Id, p2Id, pt2Id),
      this.currentTier
    );
    
    if (!result.success) {
      console.warn('Failed to connect:', result.reason, result.message);
      
      if (result.showUpgrade) {
        const prompt = getUpgradePrompt(this.currentTier, 'CONNECT');
        return { ...result, upgradePrompt: prompt };
      }
      
      return result;
    }
    
    this._performConnection(piece1Id, point1Id, piece2Id, point2Id);
    
    return result;
  }
  
  // Internal method to perform connection
  _performConnection(piece1Id, point1Id, piece2Id, point2Id) {
    const piece1 = this.pieces.get(piece1Id);
    const piece2 = this.pieces.get(piece2Id);
    const point1 = piece1.connectionPoints.find(p => p.id === point1Id);
    const point2 = piece2.connectionPoints.find(p => p.id === point2Id);
    
    point1.isOccupied = true;
    point1.connectedTo = point2Id;
    point2.isOccupied = true;
    point2.connectedTo = point1Id;
    
    this.connections.push({
      id: `conn-${Date.now()}`,
      piece1Id,
      point1Id,
      piece2Id,
      point2Id,
      timestamp: Date.now()
    });
    
    this.history.push({
      action: 'connect',
      data: {
        piece1Id,
        point1Id,
        piece2Id,
        point2Id
      },
      timestamp: Date.now()
    });
    
    return true;
  }
  
  // Remove piece with usage tracker update
  removePiece(pieceId) {
    if (this.locked.has(pieceId)) {
      console.warn('Piece is locked');
      return false;
    }
    
    const piece = this.pieces.get(pieceId);
    if (!piece) return false;
    
    this.connections = this.connections.filter(conn => 
      conn.piece1Id !== pieceId && conn.piece2Id !== pieceId
    );
    
    this.pieces.forEach(p => {
      p.connectionPoints.forEach(point => {
        if (point.connectedTo === pieceId) {
          point.isOccupied = false;
          point.connectedTo = null;
        }
      });
    });
    
    this.pieces.delete(pieceId);
    this.history.push({
      action: 'remove_piece',
      pieceId,
      timestamp: Date.now()
    });
    
    if (this.usageTracker) {
      this.usageTracker.piecesUsed = Math.max(0, this.usageTracker.piecesUsed - 1);
    }
    
    return true;
  }
  
  // Lock/unlock pieces
  lockPiece(pieceId) {
    this.locked.add(pieceId);
    this.history.push({
      action: 'lock_piece',
      pieceId,
      timestamp: Date.now()
    });
  }
  
  unlockPiece(pieceId) {
    this.locked.delete(pieceId);
    this.history.push({
      action: 'unlock_piece',
      pieceId,
      timestamp: Date.now()
    });
  }
  
  // Get usage statistics
  getUsageStats() {
    return this.usageTracker ? this.usageTracker.getUsageStats() : null;
  }
  
  // Check if an operation would exceed limits
  checkOperationLimit(operation) {
    return checkLimits(operation, this.currentTier);
  }
  
  // Change tier
  changeTier(newTier) {
    this.currentTier = newTier;
    this.usageTracker = resetUsageTracker(newTier);
    this.usageTracker.piecesUsed = this.pieces.size;
    
    console.log(`Tier changed to ${newTier}. Current usage:`, this.getUsageStats());
    
    return this.getUsageStats();
  }
  
  // Safe serialization
  toSafeData() {
    return {
      id: this.id,
      name: this.name,
      pieces: Array.from(this.pieces.values()).map(p => p.toSafeData()),
      connections: [...this.connections],
      history: [...this.history],
      locked: Array.from(this.locked),
      currentTier: this.currentTier,
      usageStats: this.usageTracker ? this.usageTracker.getUsageStats() : null,
      lastModified: Date.now()
    };
  }
  
  // ENHANCED SAVE with automatic backup
  save() {
    // Create safety backup before save
    const backup = createSafetyBackup(this.id, this.toSafeData(), 'pre-save');
    
    const result = guardedSave(this, this.currentTier);
    
    if (!result.success) {
      if (result.showUpgrade) {
        const prompt = getUpgradePrompt(this.currentTier, 'SAVE');
        return { ...result, upgradePrompt: prompt };
      }
      return result;
    }
    
    try {
      const safeData = this.toSafeData();
      const success = safeLocalStorageSet(`assembly_${this.id}`, safeData);
      
      if (success) {
        console.log('Assembly saved successfully');
        return { ...result, saved: true, backup: backup.backupKey };
      }
      
      if (backup.success) {
        console.warn('Save failed, backup available:', backup.backupKey);
        return { 
          success: false, 
          reason: 'SAVE_FAILED_BACKUP_AVAILABLE',
          backup: backup.backupKey,
          restore: backup.restore
        };
      }
      
      return { success: false, reason: 'SAVE_FAILED' };
    } catch (error) {
      console.error('Save error:', error);
      
      if (backup.success && backup.restore) {
        return {
          success: false,
          reason: 'SAVE_ERROR_BACKUP_AVAILABLE',
          error: error.message,
          backup: backup.backupKey,
          restore: backup.restore
        };
      }
      
      return { success: false, reason: 'SAVE_ERROR', error: error.message };
    }
  }
  
  // ENHANCED LOAD with recovery fallback chain
  static async load(assemblyId, options = {}) {
    try {
      const data = safeLocalStorageGet(`assembly_${assemblyId}`);
      
      if (data && !data.corrupted) {
        const assembly = new Assembly(data.currentTier || 'freemium');
        assembly.id = data.id;
        assembly.name = data.name;
        
        if (data.pieces) {
          if (Array.isArray(data.pieces)) {
            data.pieces.forEach(pieceData => {
              const piece = new CrochetPiece(pieceData);
              assembly.pieces.set(piece.id, piece);
            });
          } else if (typeof data.pieces === 'object') {
            Object.entries(data.pieces).forEach(([id, pieceData]) => {
              const piece = new CrochetPiece(pieceData);
              assembly.pieces.set(id, piece);
            });
          }
        }
        
        assembly.connections = data.connections || [];
        assembly.history = data.history || [];
        assembly.locked = new Set(data.locked || []);
        
        if (assembly.usageTracker) {
          assembly.usageTracker.piecesUsed = assembly.pieces.size;
          if (data.usageStats) {
            assembly.usageTracker.savesUsed = data.usageStats.saves?.used || 0;
            assembly.usageTracker.customPiecesUsed = data.usageStats.customPieces?.used || 0;
          }
        }
        
        console.log('Assembly loaded successfully');
        return assembly;
      }
      
      console.warn('Normal load failed, attempting recovery...');
      const recovery = await recoverAssembly(assemblyId, options);
      
      if (recovery.success && recovery.data) {
        const assembly = Assembly.fromRecoveredData(recovery.data);
        console.log('Assembly recovered successfully:', recovery.message);
        return assembly;
      }
      
      console.error('Load and recovery failed');
      return null;
      
    } catch (error) {
      console.error('Load error:', error);
      
      try {
        const recovery = await recoverAssembly(assemblyId, { 
          ...options, 
          skipOriginal: true 
        });
        
        if (recovery.success && recovery.data) {
          const assembly = Assembly.fromRecoveredData(recovery.data);
          console.log('Assembly recovered after error:', recovery.message);
          return assembly;
        }
      } catch (recoveryError) {
        console.error('Recovery also failed:', recoveryError);
      }
      
      return null;
    }
  }
  
  // Create assembly from recovered data
  static fromRecoveredData(data) {
    const assembly = new Assembly(data.currentTier || 'freemium');
    assembly.id = data.id;
    assembly.name = data.name;
    assembly.isRecovered = true;
    assembly.recoveryInfo = data.recoveryInfo;
    
    if (data.pieces) {
      if (Array.isArray(data.pieces)) {
        data.pieces.forEach(pieceData => {
          if (pieceData && pieceData.id) {
            const piece = new CrochetPiece({
              ...pieceData,
              recovered: true
            });
            assembly.pieces.set(piece.id, piece);
          }
        });
      } else if (typeof data.pieces === 'object') {
        Object.entries(data.pieces).forEach(([id, pieceData]) => {
          if (pieceData) {
            const piece = new CrochetPiece({
              ...pieceData,
              id: pieceData.id || id,
              recovered: true
            });
            assembly.pieces.set(piece.id || id, piece);
          }
        });
      }
    }
    
    if (Array.isArray(data.connections)) {
      assembly.connections = data.connections.filter(conn => {
        return conn && 
               assembly.pieces.has(conn.piece1Id) && 
               assembly.pieces.has(conn.piece2Id);
      });
    } else {
      assembly.connections = [];
    }
    
    assembly.history = Array.isArray(data.history) ? data.history : [];
    assembly.locked = Array.isArray(data.locked) ? new Set(data.locked) : new Set();
    
    assembly.history.push({
      action: 'recovered',
      strategy: data.recoveryInfo?.finalStrategy || 'unknown',
      timestamp: Date.now()
    });
    
    console.log(`Assembly recovered: ${assembly.pieces.size} pieces, ${assembly.connections.length} connections`);
    
    return assembly;
  }
  
  // Perform risky operation with automatic backup
  performRiskyOperation(operation, operationName = 'risky_operation') {
    const backup = createSafetyBackup(this.id, this.toSafeData(), operationName);
    
    if (!backup.success) {
      console.warn('Could not create safety backup, proceeding with caution');
    }
    
    try {
      const result = operation();
      
      return {
        success: true,
        result,
        backup: backup.backupKey
      };
      
    } catch (error) {
      console.error(`${operationName} failed:`, error);
      
      if (backup.success && backup.restore) {
        const restored = backup.restore();
        if (restored) {
          const recoveredAssembly = Assembly.fromRecoveredData(restored);
          
          this.pieces = recoveredAssembly.pieces;
          this.connections = recoveredAssembly.connections;
          this.history = recoveredAssembly.history;
          this.locked = recoveredAssembly.locked;
          
          console.log('Assembly restored from backup after failed operation');
          
          return {
            success: false,
            error: error.message,
            recovered: true,
            backup: backup.backupKey
          };
        }
      }
      
      return {
        success: false,
        error: error.message,
        recovered: false
      };
    }
  }
  
  // Get backup information
  getBackupInfo() {
    const backups = recoverySystem.backupManager.getBackups(this.id);
    
    return {
      count: backups.length,
      backups: backups.map(b => ({
        key: b.key,
        timestamp: b.timestamp,
        age: Date.now() - b.timestamp,
        ageText: this.formatAge(Date.now() - b.timestamp)
      })),
      maxBackups: recoverySystem.backupManager.maxBackups
    };
  }
  
  // Format age in human-readable format
  formatAge(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }
  
  // Manually trigger a backup
  createBackup(reason = 'manual') {
    const backup = createSafetyBackup(this.id, this.toSafeData(), reason);
    
    if (backup.success) {
      this.history.push({
        action: 'backup_created',
        reason,
        backupKey: backup.backupKey,
        timestamp: Date.now()
      });
      
      console.log(`Manual backup created: ${backup.backupKey}`);
      return backup;
    }
    
    return { success: false, reason: 'Backup creation failed' };
  }
  
  // Clear all backups
  clearBackups() {
    recoverySystem.backupManager.clearBackups(this.id);
    
    this.history.push({
      action: 'backups_cleared',
      timestamp: Date.now()
    });
    
    return { success: true, message: 'All backups cleared' };
  }
}
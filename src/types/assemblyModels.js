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
    this.isCustom = data.isCustom || false; // NEW: Track if this is a custom piece
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
 * Assembly class - manages connected pieces with tier enforcement
 */
export class Assembly {
  constructor(tier = 'freemium') {
    this.id = `assembly-${Date.now()}`;
    this.name = 'New Assembly';
    this.pieces = new Map();
    this.connections = [];
    this.history = [];
    this.locked = new Set();
    this.currentTier = tier; // NEW: Track current tier
    this.usageTracker = getUsageTracker(tier); // NEW: Initialize usage tracking
  }
  
  // EXISTING: Your validation method stays the same
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
  
  // EXISTING: Your validate method stays the same
  validate() {
    return validateAssembly(this);
  }
  
  // UPDATED: Add piece with tier enforcement
  addPiece(piece) {
    if (!(piece instanceof CrochetPiece)) {
      console.error('Must be a CrochetPiece instance');
      return { success: false, reason: 'INVALID_PIECE_TYPE' };
    }
    
    // Check if assembly is locked (preserving your locked set logic)
    if (this.locked.has(piece.id)) {
      console.warn('Piece is locked');
      return { success: false, reason: 'PIECE_LOCKED' };
    }
    
    // NEW: Use guarded version for tier enforcement
    const result = guardedAddPiece(this, piece, this.currentTier);
    
    if (!result.success) {
      console.warn('Failed to add piece:', result.reason, result.message);
      
      // Return upgrade prompt if needed
      if (result.showUpgrade) {
        const prompt = getUpgradePrompt(this.currentTier, 'ADD_PIECE');
        return { ...result, upgradePrompt: prompt };
      }
      
      return result;
    }
    
    // guardedAddPiece already added the piece via _directAddPiece
    return result;
  }
  
  // NEW: Direct add piece method (called by guardedAddPiece internally)
  // This bypasses the guard to avoid infinite recursion
  _directAddPiece(piece) {
    this.pieces.set(piece.id, piece);
    this.history.push({
      action: 'add_piece',
      pieceId: piece.id,
      timestamp: Date.now()
    });
    return true;
  }
  
  // NEW: Connect with tier enforcement
  connect(piece1Id, point1Id, piece2Id, point2Id) {
    // Check if pieces are locked (preserving your locked set logic)
    if (this.locked.has(piece1Id) || this.locked.has(piece2Id)) {
      console.warn('One or both pieces are locked');
      return { success: false, reason: 'PIECES_LOCKED' };
    }
    
    // Use guarded version for tier enforcement and validation
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
    
    // If validation passed, perform the actual connection
    this._performConnection(piece1Id, point1Id, piece2Id, point2Id);
    
    return result;
  }
  
  // NEW: Internal method to perform connection
  _performConnection(piece1Id, point1Id, piece2Id, point2Id) {
    const piece1 = this.pieces.get(piece1Id);
    const piece2 = this.pieces.get(piece2Id);
    const point1 = piece1.connectionPoints.find(p => p.id === point1Id);
    const point2 = piece2.connectionPoints.find(p => p.id === point2Id);
    
    // Mark points as occupied
    point1.isOccupied = true;
    point1.connectedTo = point2Id;
    point2.isOccupied = true;
    point2.connectedTo = point1Id;
    
    // Store connection
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
  
  // NEW: Remove piece (with usage tracker update)
  removePiece(pieceId) {
    if (this.locked.has(pieceId)) {
      console.warn('Piece is locked');
      return false;
    }
    
    const piece = this.pieces.get(pieceId);
    if (!piece) return false;
    
    // Remove all connections to this piece
    this.connections = this.connections.filter(conn => 
      conn.piece1Id !== pieceId && conn.piece2Id !== pieceId
    );
    
    // Clear occupied flags
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
    
    // Update usage tracker
    if (this.usageTracker) {
      this.usageTracker.piecesUsed = Math.max(0, this.usageTracker.piecesUsed - 1);
    }
    
    return true;
  }
  
  // NEW: Lock/unlock pieces (preserving your Set-based locking)
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
  
  // NEW: Get usage statistics
  getUsageStats() {
    return this.usageTracker ? this.usageTracker.getUsageStats() : null;
  }
  
  // NEW: Check if an operation would exceed limits
  checkOperationLimit(operation) {
    return checkLimits(operation, this.currentTier);
  }
  
  // NEW: Change tier (for testing or upgrades)
  changeTier(newTier) {
    this.currentTier = newTier;
    this.usageTracker = resetUsageTracker(newTier);
    
    // Recalculate current usage
    this.usageTracker.piecesUsed = this.pieces.size;
    
    console.log(`Tier changed to ${newTier}. Current usage:`, this.getUsageStats());
    
    return this.getUsageStats();
  }
  
  // EXISTING: Safe serialization (enhanced with tier data)
  toSafeData() {
    return {
      id: this.id,
      name: this.name,
      pieces: Array.from(this.pieces.values()).map(p => p.toSafeData()),
      connections: [...this.connections],
      history: [...this.history],
      locked: Array.from(this.locked),
      currentTier: this.currentTier, // NEW
      usageStats: this.usageTracker ? this.usageTracker.getUsageStats() : null, // NEW
      lastModified: Date.now() // NEW
    };
  }
  
  // UPDATED: Save with tier enforcement
  save() {
    const result = guardedSave(this, this.currentTier);
    
    if (!result.success) {
      if (result.showUpgrade) {
        const prompt = getUpgradePrompt(this.currentTier, 'SAVE');
        return { ...result, upgradePrompt: prompt };
      }
      return result;
    }
    
    // Perform actual save using your existing method
    const safeData = this.toSafeData();
    const success = safeLocalStorageSet(`assembly_${this.id}`, safeData);
    
    if (success) {
      console.log('Assembly saved successfully');
      return { ...result, saved: true };
    }
    
    return { success: false, reason: 'SAVE_FAILED' };
  }
  
  // UPDATED: Load from localStorage (with tier support)
  static load(assemblyId) {
    const data = safeLocalStorageGet(`assembly_${assemblyId}`);
    if (data) {
      const assembly = new Assembly(data.currentTier || 'freemium');
      assembly.id = data.id;
      assembly.name = data.name;
      
      // Reconstruct pieces
      if (data.pieces) {
        data.pieces.forEach(pieceData => {
          const piece = new CrochetPiece(pieceData);
          assembly.pieces.set(piece.id, piece);
        });
      }
      
      assembly.connections = data.connections || [];
      assembly.history = data.history || [];
      assembly.locked = new Set(data.locked || []);
      
      // Update usage tracker with actual counts
      if (assembly.usageTracker) {
        assembly.usageTracker.piecesUsed = assembly.pieces.size;
        // Import saved usage stats if available
        if (data.usageStats) {
          assembly.usageTracker.savesUsed = data.usageStats.saves?.used || 0;
          assembly.usageTracker.customPiecesUsed = data.usageStats.customPieces?.used || 0;
        }
      }
      
      console.log('Assembly loaded successfully');
      return assembly;
    }
    return null;
  }
}
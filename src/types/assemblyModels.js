// src/types/assemblyModels.js
import { toSafeVector3, toSafeColor, createSafePieceData } from '../utils/safeTypes';

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
      isOccupied: false
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
 * Assembly class - manages connected pieces
 */
export class Assembly {
  constructor() {
    this.id = `assembly-${Date.now()}`;
    this.name = 'New Assembly';
    this.pieces = new Map();
    this.connections = [];
    this.history = [];
    this.locked = new Set();
  }
  
  addPiece(piece) {
    if (!(piece instanceof CrochetPiece)) {
      console.error('Must be a CrochetPiece instance');
      return false;
    }
    this.pieces.set(piece.id, piece);
    this.history.push({
      action: 'add_piece',
      pieceId: piece.id,
      timestamp: Date.now()
    });
    return true;
  }
  
  // Safe serialization
  toSafeData() {
    return {
      id: this.id,
      name: this.name,
      pieces: Array.from(this.pieces.values()).map(p => p.toSafeData()),
      connections: [...this.connections],
      history: [...this.history],
      locked: Array.from(this.locked)
    };
  }
}

// src/utils/multiSelectManager.js
// D12: Multi-select system for batch operations

import { toSafeVector3 } from './safeTypes';

export class MultiSelectManager {
  constructor() {
    this.selectedPieces = new Set();
    this.selectionGroups = new Map();
    this.selectionHistory = [];
    this.clipboard = null;
    this.selectionMode = 'single'; // single, multiple, box, lasso
    this.maxSelectionHistory = 20;
    
    this.initializeActions();
  }
  
  initializeActions() {
    // Define available batch actions
    this.batchActions = {
      move: {
        name: 'Move',
        icon: '↔️',
        hotkey: 'M',
        validate: (pieces) => pieces.size > 0,
        execute: (pieces, params, assembly) => this.batchMove(pieces, params, assembly)
      },
      rotate: {
        name: 'Rotate',
        icon: '🔄',
        hotkey: 'R',
        validate: (pieces) => pieces.size > 0,
        execute: (pieces, params, assembly) => this.batchRotate(pieces, params, assembly)
      },
      scale: {
        name: 'Scale',
        icon: '📐',
        hotkey: 'S',
        validate: (pieces) => pieces.size > 0,
        execute: (pieces, params, assembly) => this.batchScale(pieces, params, assembly)
      },
      duplicate: {
        name: 'Duplicate',
        icon: '📋',
        hotkey: 'Ctrl+D',
        validate: (pieces) => pieces.size > 0 && pieces.size <= 50,
        execute: (pieces, params, assembly) => this.batchDuplicate(pieces, params, assembly)
      },
      delete: {
        name: 'Delete',
        icon: '🗑️',
        hotkey: 'Delete',
        validate: (pieces) => pieces.size > 0,
        execute: (pieces, params, assembly) => this.batchDelete(pieces, params, assembly)
      },
      group: {
        name: 'Group',
        icon: '📦',
        hotkey: 'Ctrl+G',
        validate: (pieces) => pieces.size > 1,
        execute: (pieces, params, assembly) => this.createGroup(pieces, params, assembly)
      },
      ungroup: {
        name: 'Ungroup',
        icon: '📤',
        hotkey: 'Ctrl+Shift+G',
        validate: (pieces) => this.hasGroups(pieces),
        execute: (pieces, params, assembly) => this.ungroup(pieces, params, assembly)
      },
      align: {
        name: 'Align',
        icon: '📏',
        hotkey: 'A',
        validate: (pieces) => pieces.size > 1,
        execute: (pieces, params, assembly) => this.batchAlign(pieces, params, assembly)
      },
      distribute: {
        name: 'Distribute',
        icon: '⬚',
        hotkey: 'D',
        validate: (pieces) => pieces.size > 2,
        execute: (pieces, params, assembly) => this.batchDistribute(pieces, params, assembly)
      },
      mirror: {
        name: 'Mirror',
        icon: '🪞',
        hotkey: 'Ctrl+M',
        validate: (pieces) => pieces.size > 0,
        execute: (pieces, params, assembly) => this.batchMirror(pieces, params, assembly)
      },
      changeColor: {
        name: 'Change Color',
        icon: '🎨',
        hotkey: 'C',
        validate: (pieces) => pieces.size > 0,
        execute: (pieces, params, assembly) => this.batchChangeColor(pieces, params, assembly)
      },
      changePattern: {
        name: 'Change Pattern',
        icon: '🧶',
        hotkey: 'P',
        validate: (pieces) => pieces.size > 0,
        execute: (pieces, params, assembly) => this.batchChangePattern(pieces, params, assembly)
      }
    };
  }
  
  // Selection methods
  selectPiece(pieceId, mode = 'single') {
    if (mode === 'single') {
      this.clearSelection();
    }
    
    this.selectedPieces.add(pieceId);
    this.recordSelection();
    
    return {
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size
    };
  }
  
  deselectPiece(pieceId) {
    this.selectedPieces.delete(pieceId);
    this.recordSelection();
    
    return {
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size
    };
  }
  
  togglePiece(pieceId) {
    if (this.selectedPieces.has(pieceId)) {
      this.deselectPiece(pieceId);
    } else {
      this.selectPiece(pieceId, 'multiple');
    }
    
    return {
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size
    };
  }
  
  selectMultiple(pieceIds) {
    for (const id of pieceIds) {
      this.selectedPieces.add(id);
    }
    this.recordSelection();
    
    return {
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size
    };
  }
  
  selectAll(assembly) {
    this.selectedPieces = new Set(assembly.pieces.keys());
    this.recordSelection();
    
    return {
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size
    };
  }
  
  selectByType(type, assembly) {
    this.clearSelection();
    
    for (const [id, piece] of assembly.pieces) {
      if (piece.type === type) {
        this.selectedPieces.add(id);
      }
    }
    
    this.recordSelection();
    
    return {
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size
    };
  }
  
  selectConnected(pieceId, assembly) {
    this.clearSelection();
    const visited = new Set();
    
    this.traverseConnected(pieceId, assembly, visited);
    this.selectedPieces = visited;
    this.recordSelection();
    
    return {
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size
    };
  }
  
  selectInBox(box, assembly) {
    this.clearSelection();
    
    for (const [id, piece] of assembly.pieces) {
      if (this.isInBox(piece, box)) {
        this.selectedPieces.add(id);
      }
    }
    
    this.recordSelection();
    
    return {
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size
    };
  }
  
  selectByLasso(points, assembly) {
    this.clearSelection();
    
    for (const [id, piece] of assembly.pieces) {
      if (this.isInPolygon(piece, points)) {
        this.selectedPieces.add(id);
      }
    }
    
    this.recordSelection();
    
    return {
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size
    };
  }
  
  invertSelection(assembly) {
    const inverted = new Set();
    
    for (const id of assembly.pieces.keys()) {
      if (!this.selectedPieces.has(id)) {
        inverted.add(id);
      }
    }
    
    this.selectedPieces = inverted;
    this.recordSelection();
    
    return {
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size
    };
  }
  
  clearSelection() {
    this.selectedPieces.clear();
    this.recordSelection();
    
    return {
      selected: [],
      count: 0
    };
  }
  
  // Batch action methods
  batchMove(pieces, params, assembly) {
    const { offset = { x: 0, y: 0, z: 0 } } = params;
    const results = [];
    
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece) {
        const oldPosition = piece.position || { x: 0, y: 0, z: 0 };
        const newPosition = toSafeVector3({
          x: oldPosition.x + offset.x,
          y: oldPosition.y + offset.y,
          z: oldPosition.z + offset.z
        });
        
        piece.position = newPosition;
        results.push({
          pieceId,
          oldPosition,
          newPosition
        });
      }
    }
    
    return {
      action: 'move',
      affected: results.length,
      details: results
    };
  }
  
  batchRotate(pieces, params, assembly) {
    const { angle = 0, axis = 'y' } = params;
    const results = [];
    
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece) {
        const oldRotation = piece.rotation || { x: 0, y: 0, z: 0 };
        const newRotation = { ...oldRotation };
        newRotation[axis] += angle;
        
        piece.rotation = toSafeVector3(newRotation);
        results.push({
          pieceId,
          oldRotation,
          newRotation: piece.rotation
        });
      }
    }
    
    return {
      action: 'rotate',
      affected: results.length,
      details: results
    };
  }
  
  batchScale(pieces, params, assembly) {
    const { scale = 1, uniform = true } = params;
    const results = [];
    
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece) {
        const oldScale = piece.scale || { x: 1, y: 1, z: 1 };
        let newScale;
        
        if (uniform) {
          newScale = toSafeVector3({
            x: oldScale.x * scale,
            y: oldScale.y * scale,
            z: oldScale.z * scale
          });
        } else {
          newScale = toSafeVector3({
            x: oldScale.x * (params.scaleX || 1),
            y: oldScale.y * (params.scaleY || 1),
            z: oldScale.z * (params.scaleZ || 1)
          });
        }
        
        piece.scale = newScale;
        results.push({
          pieceId,
          oldScale,
          newScale
        });
      }
    }
    
    return {
      action: 'scale',
      affected: results.length,
      details: results
    };
  }
  
  batchDuplicate(pieces, params, assembly) {
    const { offset = { x: 10, y: 0, z: 10 } } = params;
    const duplicates = [];
    const pieceMap = new Map(); // Old ID -> New ID
    
    // First pass: duplicate pieces
    for (const pieceId of pieces) {
      const original = assembly.pieces.get(pieceId);
      if (original) {
        const newId = `${pieceId}_copy_${Date.now()}`;
        const duplicate = {
          ...original,
          id: newId,
          position: toSafeVector3({
            x: (original.position?.x || 0) + offset.x,
            y: (original.position?.y || 0) + offset.y,
            z: (original.position?.z || 0) + offset.z
          }),
          metadata: {
            ...original.metadata,
            duplicatedFrom: pieceId,
            duplicatedAt: Date.now()
          }
        };
        
        assembly.pieces.set(newId, duplicate);
        duplicates.push(newId);
        pieceMap.set(pieceId, newId);
      }
    }
    
    // Second pass: duplicate connections between selected pieces
    for (const conn of assembly.connections) {
      if (pieceMap.has(conn.fromPiece) && pieceMap.has(conn.toPiece)) {
        const newConnection = {
          fromPiece: pieceMap.get(conn.fromPiece),
          fromPoint: conn.fromPoint,
          toPiece: pieceMap.get(conn.toPiece),
          toPoint: conn.toPoint
        };
        assembly.connections.add(newConnection);
      }
    }
    
    // Select the duplicated pieces
    this.clearSelection();
    this.selectMultiple(duplicates);
    
    return {
      action: 'duplicate',
      affected: duplicates.length,
      newPieces: duplicates,
      pieceMap: Object.fromEntries(pieceMap)
    };
  }
  
  batchDelete(pieces, params, assembly) {
    const deleted = [];
    const deletedConnections = [];
    
    for (const pieceId of pieces) {
      if (assembly.pieces.has(pieceId)) {
        // Remove piece
        assembly.pieces.delete(pieceId);
        deleted.push(pieceId);
        
        // Remove associated connections
        const connectionsToRemove = [];
        for (const conn of assembly.connections) {
          if (conn.fromPiece === pieceId || conn.toPiece === pieceId) {
            connectionsToRemove.push(conn);
          }
        }
        
        for (const conn of connectionsToRemove) {
          assembly.connections.delete(conn);
          deletedConnections.push(conn);
        }
      }
    }
    
    this.clearSelection();
    
    return {
      action: 'delete',
      affected: deleted.length,
      deletedPieces: deleted,
      deletedConnections
    };
  }
  
  createGroup(pieces, params, assembly) {
    const { name = `Group_${Date.now()}` } = params;
    const groupId = `group_${Date.now()}`;
    
    const group = {
      id: groupId,
      name,
      pieces: Array.from(pieces),
      created: Date.now(),
      center: this.calculateCenter(pieces, assembly)
    };
    
    this.selectionGroups.set(groupId, group);
    
    // Mark pieces as grouped
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece) {
        if (!piece.metadata) piece.metadata = {};
        piece.metadata.groupId = groupId;
      }
    }
    
    return {
      action: 'group',
      groupId,
      name,
      pieceCount: pieces.size
    };
  }
  
  ungroup(pieces, params, assembly) {
    const ungrouped = [];
    const removedGroups = [];
    
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece?.metadata?.groupId) {
        const groupId = piece.metadata.groupId;
        delete piece.metadata.groupId;
        ungrouped.push(pieceId);
        
        if (!removedGroups.includes(groupId)) {
          removedGroups.push(groupId);
          this.selectionGroups.delete(groupId);
        }
      }
    }
    
    return {
      action: 'ungroup',
      affected: ungrouped.length,
      removedGroups
    };
  }
  
  batchAlign(pieces, params, assembly) {
    const { alignment = 'center', axis = 'x' } = params;
    const positions = [];
    
    // Get all positions
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece) {
        positions.push(piece.position?.[axis] || 0);
      }
    }
    
    if (positions.length === 0) return { action: 'align', affected: 0 };
    
    // Calculate alignment position
    let alignPosition;
    switch (alignment) {
      case 'min':
        alignPosition = Math.min(...positions);
        break;
      case 'max':
        alignPosition = Math.max(...positions);
        break;
      case 'center':
      default:
        alignPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
        break;
    }
    
    // Apply alignment
    const results = [];
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece) {
        if (!piece.position) piece.position = { x: 0, y: 0, z: 0 };
        const oldPosition = { ...piece.position };
        piece.position[axis] = alignPosition;
        piece.position = toSafeVector3(piece.position);
        
        results.push({
          pieceId,
          oldPosition,
          newPosition: piece.position
        });
      }
    }
    
    return {
      action: 'align',
      alignment,
      axis,
      affected: results.length,
      details: results
    };
  }
  
  batchDistribute(pieces, params, assembly) {
    const { axis = 'x', spacing = 'equal' } = params;
    const piecesArray = Array.from(pieces);
    
    if (piecesArray.length < 3) {
      return { action: 'distribute', affected: 0, error: 'Need at least 3 pieces' };
    }
    
    // Get pieces with positions
    const piecesWithPos = piecesArray
      .map(id => ({
        id,
        piece: assembly.pieces.get(id),
        position: assembly.pieces.get(id)?.position?.[axis] || 0
      }))
      .filter(p => p.piece)
      .sort((a, b) => a.position - b.position);
    
    if (piecesWithPos.length < 3) {
      return { action: 'distribute', affected: 0 };
    }
    
    const first = piecesWithPos[0];
    const last = piecesWithPos[piecesWithPos.length - 1];
    const totalDistance = last.position - first.position;
    const gap = totalDistance / (piecesWithPos.length - 1);
    
    // Apply distribution
    const results = [];
    for (let i = 1; i < piecesWithPos.length - 1; i++) {
      const item = piecesWithPos[i];
      const oldPosition = { ...item.piece.position };
      
      if (!item.piece.position) item.piece.position = { x: 0, y: 0, z: 0 };
      item.piece.position[axis] = first.position + (gap * i);
      item.piece.position = toSafeVector3(item.piece.position);
      
      results.push({
        pieceId: item.id,
        oldPosition,
        newPosition: item.piece.position
      });
    }
    
    return {
      action: 'distribute',
      axis,
      affected: results.length,
      details: results
    };
  }
  
  batchMirror(pieces, params, assembly) {
    const { axis = 'x', center = 0 } = params;
    const results = [];
    
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece) {
        if (!piece.position) piece.position = { x: 0, y: 0, z: 0 };
        const oldPosition = { ...piece.position };
        
        // Mirror position
        const distance = piece.position[axis] - center;
        piece.position[axis] = center - distance;
        piece.position = toSafeVector3(piece.position);
        
        // Also flip the piece if it has orientation
        if (piece.metadata?.orientation) {
          piece.metadata.orientation = piece.metadata.orientation === 'left' ? 'right' : 'left';
        }
        
        results.push({
          pieceId,
          oldPosition,
          newPosition: piece.position
        });
      }
    }
    
    return {
      action: 'mirror',
      axis,
      center,
      affected: results.length,
      details: results
    };
  }
  
  batchChangeColor(pieces, params, assembly) {
    const { color } = params;
    if (!color) return { action: 'changeColor', affected: 0, error: 'No color specified' };
    
    const results = [];
    
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece) {
        const oldColor = piece.color || '#888888';
        piece.color = color;
        
        results.push({
          pieceId,
          oldColor,
          newColor: color
        });
      }
    }
    
    return {
      action: 'changeColor',
      color,
      affected: results.length,
      details: results
    };
  }
  
  batchChangePattern(pieces, params, assembly) {
    const { pattern } = params;
    if (!pattern) return { action: 'changePattern', affected: 0, error: 'No pattern specified' };
    
    const results = [];
    
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece) {
        if (!piece.metadata) piece.metadata = {};
        const oldPattern = piece.metadata.pattern || [];
        piece.metadata.pattern = pattern;
        
        results.push({
          pieceId,
          oldPattern,
          newPattern: pattern
        });
      }
    }
    
    return {
      action: 'changePattern',
      pattern,
      affected: results.length,
      details: results
    };
  }
  
  // Clipboard operations
  copySelection() {
    if (this.selectedPieces.size === 0) {
      return { error: 'No pieces selected' };
    }
    
    this.clipboard = {
      pieces: Array.from(this.selectedPieces),
      timestamp: Date.now(),
      type: 'pieces'
    };
    
    return {
      action: 'copy',
      count: this.selectedPieces.size
    };
  }
  
  cutSelection(assembly) {
    const copyResult = this.copySelection();
    if (copyResult.error) return copyResult;
    
    const deleteResult = this.batchDelete(this.selectedPieces, {}, assembly);
    
    return {
      action: 'cut',
      copied: copyResult.count,
      deleted: deleteResult.affected
    };
  }
  
  paste(assembly, offset = { x: 10, y: 0, z: 10 }) {
    if (!this.clipboard || this.clipboard.pieces.length === 0) {
      return { error: 'Clipboard is empty' };
    }
    
    // Filter out pieces that no longer exist
    const validPieces = new Set(
      this.clipboard.pieces.filter(id => assembly.pieces.has(id))
    );
    
    if (validPieces.size === 0) {
      return { error: 'No valid pieces in clipboard' };
    }
    
    return this.batchDuplicate(validPieces, { offset }, assembly);
  }
  
  // Helper methods
  traverseConnected(pieceId, assembly, visited) {
    visited.add(pieceId);
    const connections = assembly.getConnectionsForPiece(pieceId);
    
    for (const conn of connections) {
      const nextId = conn.fromPiece === pieceId ? conn.toPiece : conn.fromPiece;
      if (!visited.has(nextId)) {
        this.traverseConnected(nextId, assembly, visited);
      }
    }
  }
  
  isInBox(piece, box) {
    const pos = piece.position || { x: 0, y: 0, z: 0 };
    return pos.x >= box.min.x && pos.x <= box.max.x &&
           pos.y >= box.min.y && pos.y <= box.max.y &&
           pos.z >= box.min.z && pos.z <= box.max.z;
  }
  
  isInPolygon(piece, points) {
    // Simple point-in-polygon test (2D)
    const pos = piece.position || { x: 0, y: 0, z: 0 };
    let inside = false;
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      
      const intersect = ((yi > pos.y) !== (yj > pos.y)) &&
                       (pos.x < (xj - xi) * (pos.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }
  
  calculateCenter(pieces, assembly) {
    let sumX = 0, sumY = 0, sumZ = 0;
    let count = 0;
    
    for (const pieceId of pieces) {
      const piece = assembly.pieces.get(pieceId);
      if (piece?.position) {
        sumX += piece.position.x || 0;
        sumY += piece.position.y || 0;
        sumZ += piece.position.z || 0;
        count++;
      }
    }
    
    if (count === 0) return { x: 0, y: 0, z: 0 };
    
    return toSafeVector3({
      x: sumX / count,
      y: sumY / count,
      z: sumZ / count
    });
  }
  
  hasGroups(pieces) {
    for (const pieceId of pieces) {
      for (const group of this.selectionGroups.values()) {
        if (group.pieces.includes(pieceId)) {
          return true;
        }
      }
    }
    return false;
  }
  
  recordSelection() {
    this.selectionHistory.push({
      pieces: Array.from(this.selectedPieces),
      timestamp: Date.now()
    });
    
    if (this.selectionHistory.length > this.maxSelectionHistory) {
      this.selectionHistory.shift();
    }
  }
  
  // Execute any action
  executeAction(actionName, assembly, params = {}) {
    const action = this.batchActions[actionName];
    if (!action) {
      return { error: `Unknown action: ${actionName}` };
    }
    
    if (!action.validate(this.selectedPieces)) {
      return { error: `Invalid selection for ${actionName}` };
    }
    
    return action.execute(this.selectedPieces, params, assembly);
  }
  
  // Get available actions for current selection
  getAvailableActions() {
    const available = [];
    
    for (const [key, action] of Object.entries(this.batchActions)) {
      if (action.validate(this.selectedPieces)) {
        available.push({
          key,
          name: action.name,
          icon: action.icon,
          hotkey: action.hotkey,
          enabled: true
        });
      } else {
        available.push({
          key,
          name: action.name,
          icon: action.icon,
          hotkey: action.hotkey,
          enabled: false
        });
      }
    }
    
    return available;
  }
  
  // Export selection data
  exportSelection() {
    return {
      mode: this.selectionMode,
      selected: Array.from(this.selectedPieces),
      count: this.selectedPieces.size,
      groups: Array.from(this.selectionGroups.entries()),
      clipboard: this.clipboard,
      history: this.selectionHistory.slice(-5) // Last 5 selections
    };
  }
}

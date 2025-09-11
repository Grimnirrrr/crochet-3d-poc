// src/utils/undoRedoSystem.js
// D8: Undo/Redo system for assembly actions

import { toSafeVector3 } from './safeTypes';

export class UndoRedoSystem {
  constructor(maxHistorySize = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistorySize = maxHistorySize;
    this.isExecutingCommand = false;
    
    // Action types
    this.actionTypes = {
      ADD_PIECE: 'add_piece',
      REMOVE_PIECE: 'remove_piece',
      MOVE_PIECE: 'move_piece',
      CONNECT: 'connect',
      DISCONNECT: 'disconnect',
      MODIFY_PIECE: 'modify_piece',
      BATCH: 'batch'
    };
    
    // Callbacks
    this.callbacks = {
      onUndo: null,
      onRedo: null,
      onHistoryChange: null
    };
    
    // Statistics
    this.stats = {
      totalActions: 0,
      undoCount: 0,
      redoCount: 0,
      lastActionTime: null
    };
  }
  
  // Record an action
  recordAction(action) {
    if (this.isExecutingCommand) {
      // Don't record actions that result from undo/redo
      return;
    }
    
    // Create action record
    const actionRecord = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: action.type,
      timestamp: Date.now(),
      data: this.cloneActionData(action.data),
      undo: action.undo,
      redo: action.redo || action.execute,
      description: action.description || this.getActionDescription(action.type)
    };
    
    // Remove any actions after current index (branching history)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    
    // Add new action
    this.history.push(actionRecord);
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
    
    // Update stats
    this.stats.totalActions++;
    this.stats.lastActionTime = Date.now();
    
    // Trigger callback
    if (this.callbacks.onHistoryChange) {
      this.callbacks.onHistoryChange(this.getState());
    }
    
    return actionRecord.id;
  }
  
  // Undo last action
  undo() {
    if (!this.canUndo()) {
      return { success: false, reason: 'No actions to undo' };
    }
    
    const action = this.history[this.currentIndex];
    this.isExecutingCommand = true;
    
    try {
      // Execute undo function
      if (action.undo) {
        action.undo(action.data);
      }
      
      this.currentIndex--;
      this.stats.undoCount++;
      
      // Trigger callback
      if (this.callbacks.onUndo) {
        this.callbacks.onUndo(action);
      }
      
      if (this.callbacks.onHistoryChange) {
        this.callbacks.onHistoryChange(this.getState());
      }
      
      return {
        success: true,
        action: action,
        description: `Undid: ${action.description}`
      };
    } catch (error) {
      console.error('Undo failed:', error);
      return {
        success: false,
        reason: 'Undo operation failed',
        error: error.message
      };
    } finally {
      this.isExecutingCommand = false;
    }
  }
  
  // Redo action
  redo() {
    if (!this.canRedo()) {
      return { success: false, reason: 'No actions to redo' };
    }
    
    const action = this.history[this.currentIndex + 1];
    this.isExecutingCommand = true;
    
    try {
      // Execute redo function
      if (action.redo) {
        action.redo(action.data);
      }
      
      this.currentIndex++;
      this.stats.redoCount++;
      
      // Trigger callback
      if (this.callbacks.onRedo) {
        this.callbacks.onRedo(action);
      }
      
      if (this.callbacks.onHistoryChange) {
        this.callbacks.onHistoryChange(this.getState());
      }
      
      return {
        success: true,
        action: action,
        description: `Redid: ${action.description}`
      };
    } catch (error) {
      console.error('Redo failed:', error);
      return {
        success: false,
        reason: 'Redo operation failed',
        error: error.message
      };
    } finally {
      this.isExecutingCommand = false;
    }
  }
  
  // Batch multiple actions
  beginBatch(description = 'Batch operation') {
    this.batchActions = [];
    this.batchDescription = description;
    this.isBatching = true;
  }
  
  endBatch() {
    if (!this.isBatching) return;
    
    const batchAction = {
      type: this.actionTypes.BATCH,
      description: this.batchDescription,
      data: { actions: this.batchActions },
      undo: (data) => {
        // Undo all actions in reverse order
        for (let i = data.actions.length - 1; i >= 0; i--) {
          const action = data.actions[i];
          if (action.undo) action.undo(action.data);
        }
      },
      redo: (data) => {
        // Redo all actions in order
        for (const action of data.actions) {
          if (action.redo) action.redo(action.data);
        }
      }
    };
    
    this.recordAction(batchAction);
    this.isBatching = false;
    this.batchActions = [];
  }
  
  // Check if can undo
  canUndo() {
    return this.currentIndex >= 0;
  }
  
  // Check if can redo
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
  
  // Get current state
  getState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historyLength: this.history.length,
      currentIndex: this.currentIndex,
      currentAction: this.currentIndex >= 0 ? this.history[this.currentIndex] : null,
      nextAction: this.canRedo() ? this.history[this.currentIndex + 1] : null
    };
  }
  
  // Get history list
  getHistory(limit = 10) {
    const start = Math.max(0, this.currentIndex - limit + 1);
    const end = Math.min(this.history.length, this.currentIndex + limit + 1);
    
    return this.history.slice(start, end).map((action, index) => ({
      ...action,
      isCurrent: start + index === this.currentIndex,
      canJumpTo: true,
      relativeIndex: start + index - this.currentIndex
    }));
  }
  
  // Jump to specific point in history
  jumpTo(targetIndex) {
    if (targetIndex < 0 || targetIndex >= this.history.length) {
      return { success: false, reason: 'Invalid history index' };
    }
    
    const steps = targetIndex - this.currentIndex;
    
    if (steps > 0) {
      // Redo to target
      for (let i = 0; i < steps; i++) {
        const result = this.redo();
        if (!result.success) return result;
      }
    } else if (steps < 0) {
      // Undo to target
      for (let i = 0; i < Math.abs(steps); i++) {
        const result = this.undo();
        if (!result.success) return result;
      }
    }
    
    return {
      success: true,
      description: `Jumped to action ${targetIndex}`
    };
  }
  
  // Clear history
  clear() {
    this.history = [];
    this.currentIndex = -1;
    this.stats = {
      totalActions: 0,
      undoCount: 0,
      redoCount: 0,
      lastActionTime: null
    };
    
    if (this.callbacks.onHistoryChange) {
      this.callbacks.onHistoryChange(this.getState());
    }
  }
  
  // Clone action data to prevent mutations
  cloneActionData(data) {
    if (!data) return null;
    
    // Deep clone, but ensure safe types
    const cloned = {};
    for (const key in data) {
      const value = data[key];
      if (value && typeof value === 'object') {
        if (value.__safe) {
          // Keep safe types
          cloned[key] = { ...value };
        } else if (Array.isArray(value)) {
          cloned[key] = value.map(v => 
            typeof v === 'object' ? { ...v } : v
          );
        } else {
          cloned[key] = { ...value };
        }
      } else {
        cloned[key] = value;
      }
    }
    return cloned;
  }
  
  // Get action description
  getActionDescription(type) {
    const descriptions = {
      [this.actionTypes.ADD_PIECE]: 'Add piece',
      [this.actionTypes.REMOVE_PIECE]: 'Remove piece',
      [this.actionTypes.MOVE_PIECE]: 'Move piece',
      [this.actionTypes.CONNECT]: 'Connect pieces',
      [this.actionTypes.DISCONNECT]: 'Disconnect pieces',
      [this.actionTypes.MODIFY_PIECE]: 'Modify piece',
      [this.actionTypes.BATCH]: 'Multiple actions'
    };
    
    return descriptions[type] || 'Unknown action';
  }
  
  // Set callbacks
  setCallbacks(callbacks) {
    Object.assign(this.callbacks, callbacks);
  }
  
  // Get statistics
  getStats() {
    return {
      ...this.stats,
      historySize: this.history.length,
      currentPosition: this.currentIndex + 1,
      percentageComplete: this.history.length > 0 
        ? ((this.currentIndex + 1) / this.history.length) * 100 
        : 0
    };
  }
  
  // Export history for debugging
  exportHistory() {
    return {
      version: '1.0',
      timestamp: Date.now(),
      history: this.history.map(action => ({
        id: action.id,
        type: action.type,
        description: action.description,
        timestamp: action.timestamp,
        data: action.data
      })),
      currentIndex: this.currentIndex,
      stats: this.stats
    };
  }
}

// Helper function to create action records
export function createAction(type, data, undoFn, redoFn, description) {
  return {
    type,
    data,
    undo: undoFn,
    redo: redoFn || undoFn,
    description
  };
}

export default UndoRedoSystem;

// src/hooks/useUndoRedo.js
// React hook for undo/redo functionality

import { useEffect, useRef, useState, useCallback } from 'react';
import { UndoRedoSystem, createAction } from '../utils/undoRedoSystem';

export function useUndoRedo(assembly, options = {}) {
  const systemRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentAction, setCurrentAction] = useState(null);
  
  // Initialize undo/redo system
  useEffect(() => {
    const system = new UndoRedoSystem(options.maxHistorySize || 50);
    systemRef.current = system;
    
    // Set callbacks
    system.setCallbacks({
      onHistoryChange: (state) => {
        setCanUndo(state.canUndo);
        setCanRedo(state.canRedo);
        setCurrentAction(state.currentAction);
        updateHistory();
      },
      onUndo: (action) => {
        console.log('Undid:', action.description);
      },
      onRedo: (action) => {
        console.log('Redid:', action.description);
      }
    });
    
    return () => {
      // Cleanup if needed
    };
  }, [options.maxHistorySize]);
  
  // Update history display
  const updateHistory = useCallback(() => {
    if (systemRef.current) {
      const recentHistory = systemRef.current.getHistory(10);
      setHistory(recentHistory);
    }
  }, []);
  
  // Record add piece action
  const recordAddPiece = useCallback((piece, mesh) => {
    if (!systemRef.current || !assembly) return;
    
    const action = createAction(
      'add_piece',
      { 
        pieceId: piece.id,
        pieceData: { ...piece },
        meshId: mesh?.uuid
      },
      // Undo function
      (data) => {
        assembly.removePiece(data.pieceId);
        if (mesh && mesh.parent) {
          mesh.parent.remove(mesh);
        }
      },
      // Redo function
      (data) => {
        assembly.addPiece(data.pieceData);
        if (mesh && mesh.parent) {
          mesh.parent.add(mesh);
        }
      },
      `Add ${piece.name || piece.id}`
    );
    
    systemRef.current.recordAction(action);
  }, [assembly]);
  
  // Record remove piece action
  const recordRemovePiece = useCallback((piece, mesh) => {
    if (!systemRef.current || !assembly) return;
    
    const action = createAction(
      'remove_piece',
      {
        pieceId: piece.id,
        pieceData: { ...piece },
        meshId: mesh?.uuid,
        parent: mesh?.parent
      },
      // Undo function
      (data) => {
        assembly.addPiece(data.pieceData);
        if (mesh && data.parent) {
          data.parent.add(mesh);
        }
      },
      // Redo function
      (data) => {
        assembly.removePiece(data.pieceId);
        if (mesh && mesh.parent) {
          mesh.parent.remove(mesh);
        }
      },
      `Remove ${piece.name || piece.id}`
    );
    
    systemRef.current.recordAction(action);
  }, [assembly]);
  
  // Record move piece action
  const recordMovePiece = useCallback((piece, oldPosition, newPosition) => {
    if (!systemRef.current || !assembly) return;
    
    const action = createAction(
      'move_piece',
      {
        pieceId: piece.id,
        oldPosition: { ...oldPosition },
        newPosition: { ...newPosition }
      },
      // Undo function
      (data) => {
        assembly.updatePiecePosition(data.pieceId, data.oldPosition);
      },
      // Redo function
      (data) => {
        assembly.updatePiecePosition(data.pieceId, data.newPosition);
      },
      `Move ${piece.name || piece.id}`
    );
    
    systemRef.current.recordAction(action);
  }, [assembly]);
  
  // Record connection action
  const recordConnect = useCallback((connection) => {
    if (!systemRef.current || !assembly) return;
    
    const action = createAction(
      'connect',
      {
        connectionId: connection.id,
        piece1Id: connection.piece1Id,
        point1Id: connection.point1Id,
        piece2Id: connection.piece2Id,
        point2Id: connection.point2Id
      },
      // Undo function
      (data) => {
        assembly.disconnect(data.connectionId);
      },
      // Redo function
      (data) => {
        assembly.connect(
          data.piece1Id,
          data.point1Id,
          data.piece2Id,
          data.point2Id
        );
      },
      `Connect ${connection.piece1Id} to ${connection.piece2Id}`
    );
    
    systemRef.current.recordAction(action);
  }, [assembly]);
  
  // Record disconnection action
  const recordDisconnect = useCallback((connection) => {
    if (!systemRef.current || !assembly) return;
    
    const action = createAction(
      'disconnect',
      {
        connectionId: connection.id,
        piece1Id: connection.piece1Id,
        point1Id: connection.point1Id,
        piece2Id: connection.piece2Id,
        point2Id: connection.point2Id
      },
      // Undo function
      (data) => {
        assembly.connect(
          data.piece1Id,
          data.point1Id,
          data.piece2Id,
          data.point2Id
        );
      },
      // Redo function
      (data) => {
        assembly.disconnect(data.connectionId);
      },
      `Disconnect ${connection.piece1Id} from ${connection.piece2Id}`
    );
    
    systemRef.current.recordAction(action);
  }, [assembly]);
  
  // Perform undo
  const undo = useCallback(() => {
    if (systemRef.current) {
      const result = systemRef.current.undo();
      if (result.success) {
        updateHistory();
      }
      return result;
    }
    return { success: false, reason: 'System not initialized' };
  }, [updateHistory]);
  
  // Perform redo
  const redo = useCallback(() => {
    if (systemRef.current) {
      const result = systemRef.current.redo();
      if (result.success) {
        updateHistory();
      }
      return result;
    }
    return { success: false, reason: 'System not initialized' };
  }, [updateHistory]);
  
  // Begin batch operation
  const beginBatch = useCallback((description) => {
    if (systemRef.current) {
      systemRef.current.beginBatch(description);
    }
  }, []);
  
  // End batch operation
  const endBatch = useCallback(() => {
    if (systemRef.current) {
      systemRef.current.endBatch();
      updateHistory();
    }
  }, [updateHistory]);
  
  // Jump to specific history point
  const jumpTo = useCallback((index) => {
    if (systemRef.current) {
      const result = systemRef.current.jumpTo(index);
      if (result.success) {
        updateHistory();
      }
      return result;
    }
    return { success: false, reason: 'System not initialized' };
  }, [updateHistory]);
  
  // Clear history
  const clearHistory = useCallback(() => {
    if (systemRef.current) {
      systemRef.current.clear();
      updateHistory();
    }
  }, [updateHistory]);
  
  // Get statistics
  const getStats = useCallback(() => {
    if (systemRef.current) {
      return systemRef.current.getStats();
    }
    return null;
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
  return {
    // State
    canUndo,
    canRedo,
    history,
    currentAction,
    
    // Recording methods
    recordAddPiece,
    recordRemovePiece,
    recordMovePiece,
    recordConnect,
    recordDisconnect,
    
    // Control methods
    undo,
    redo,
    beginBatch,
    endBatch,
    jumpTo,
    clearHistory,
    
    // Utility
    getStats,
    system: systemRef.current
  };
}

export default useUndoRedo;

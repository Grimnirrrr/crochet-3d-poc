// src/hooks/useDragDrop.js
// React hook for drag & drop integration

import { useEffect, useRef, useState, useCallback } from 'react';
import { DragDropManager } from '../utils/dragDropManager';

export function useDragDrop(camera, renderer, scene, assembly) {
  const managerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(0.5);
  const [dragStats, setDragStats] = useState({
    totalDrags: 0,
    averageDragDistance: 0,
    lastDragTime: null
  });
  
  // Initialize drag & drop manager
  useEffect(() => {
    if (!camera || !renderer || !scene) return;
    
    // Create manager
    const manager = new DragDropManager(camera, renderer, scene);
    managerRef.current = manager;
    
    // Setup event listeners for drag events
    const handleDragStart = (event) => {
      setIsDragging(true);
      setDraggedPiece(event.detail.piece);
      console.log('Drag started:', event.detail.piece?.name);
    };
    
    const handleDrag = (event) => {
      // Update position in assembly if needed
      if (assembly && event.detail.piece) {
        assembly.updatePiecePosition(
          event.detail.piece.id,
          event.detail.position
        );
      }
    };
    
    const handleDragEnd = (event) => {
      setIsDragging(false);
      setDraggedPiece(null);
      
      // Update stats
      setDragStats(prev => ({
        totalDrags: prev.totalDrags + 1,
        averageDragDistance: 0, // Could calculate if needed
        lastDragTime: Date.now()
      }));
      
      console.log('Drag ended:', event.detail.piece?.name, 'at', event.detail.position);
      
      // Save assembly state after drag
      if (assembly) {
        assembly.saveToLocalStorage();
      }
    };
    
    window.addEventListener('piece-dragstart', handleDragStart);
    window.addEventListener('piece-drag', handleDrag);
    window.addEventListener('piece-dragend', handleDragEnd);
    
    return () => {
      // Cleanup
      window.removeEventListener('piece-dragstart', handleDragStart);
      window.removeEventListener('piece-drag', handleDrag);
      window.removeEventListener('piece-dragend', handleDragEnd);
      
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, [camera, renderer, scene, assembly]);
  
  // Register a mesh as draggable
  const registerDraggable = useCallback((mesh, pieceData) => {
    if (managerRef.current) {
      managerRef.current.registerPiece(mesh, pieceData);
    }
  }, []);
  
  // Unregister a draggable mesh
  const unregisterDraggable = useCallback((mesh) => {
    if (managerRef.current) {
      managerRef.current.unregisterPiece(mesh);
    }
  }, []);
  
  // Toggle grid snapping
  const toggleSnapToGrid = useCallback(() => {
    const newSnap = !snapToGrid;
    setSnapToGrid(newSnap);
    if (managerRef.current) {
      managerRef.current.setSnapToGrid(newSnap, gridSize);
    }
  }, [snapToGrid, gridSize]);
  
  // Update grid size
  const updateGridSize = useCallback((size) => {
    setGridSize(size);
    if (managerRef.current) {
      managerRef.current.setSnapToGrid(snapToGrid, size);
    }
  }, [snapToGrid]);
  
  // Set drag constraints
  const setDragConstraints = useCallback((constraints) => {
    if (managerRef.current) {
      managerRef.current.setConstraints(constraints);
    }
  }, []);
  
  // Enable/disable drag & drop
  const setEnabled = useCallback((enabled) => {
    if (managerRef.current) {
      managerRef.current.setEnabled(enabled);
    }
  }, []);
  
  // Lock vertical movement
  const toggleYLock = useCallback(() => {
    if (managerRef.current) {
      const currentLock = managerRef.current.dragConstraints.lockY;
      managerRef.current.setConstraints({ lockY: !currentLock });
      return !currentLock;
    }
    return false;
  }, []);
  
  return {
    // State
    isDragging,
    draggedPiece,
    snapToGrid,
    gridSize,
    dragStats,
    
    // Methods
    registerDraggable,
    unregisterDraggable,
    toggleSnapToGrid,
    updateGridSize,
    setDragConstraints,
    setEnabled,
    toggleYLock,
    
    // Reference to manager (for advanced use)
    manager: managerRef.current
  };
}

export default useDragDrop;

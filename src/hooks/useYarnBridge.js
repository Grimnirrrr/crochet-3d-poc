// src/hooks/useYarnBridge.js
// React hook for yarn bridge visual connections

import { useEffect, useRef, useState, useCallback } from 'react';
import { YarnBridgeManager } from '../utils/yarnBridgeManager';

export function useYarnBridge(scene, assembly, magneticSnapManager) {
  const managerRef = useRef(null);
  const [bridgesVisible, setBridgesVisible] = useState(true);
  const [yarnColor, setYarnColor] = useState(0xfbbf24);
  const [yarnThickness, setYarnThickness] = useState(0.05);
  const [yarnSag, setYarnSag] = useState(0.1);
  const [animateCreation, setAnimateCreation] = useState(true);
  const [bridgeStats, setBridgeStats] = useState({
    totalBridges: 0,
    activeBridges: 0,
    totalYarnLength: 0,
    averageLength: 0
  });
  
  // Initialize yarn bridge manager
  useEffect(() => {
    if (!scene) return;
    
    // Create manager
    const manager = new YarnBridgeManager(scene);
    managerRef.current = manager;
    
    // Set initial configuration
    manager.updateConfig({
      yarnColor,
      yarnThickness,
      yarnSag,
      animateCreation
    });
    
    // Listen for connection events from assembly
    const handleConnectionCreated = (event) => {
      const { connectionId, piece1, piece2, point1, point2 } = event.detail;
      
      // Create bridge for new connection
      createYarnBridge({
        connectionId,
        piece1Id: piece1.id,
        piece2Id: piece2.id,
        point1,
        point2,
        mesh1: piece1.mesh,
        mesh2: piece2.mesh
      });
    };
    
    const handleConnectionRemoved = (event) => {
      const { connectionId } = event.detail;
      removeYarnBridge(connectionId);
    };
    
    // Listen for snap events if magnetic snap manager exists
    if (magneticSnapManager) {
      const handleSnapComplete = (snapInfo) => {
        // Create bridge when pieces snap together
        if (snapInfo && assembly) {
          const connection = assembly.getConnection(
            snapInfo.movingPoint.pieceId,
            snapInfo.targetPoint.pieceId
          );
          
          if (connection) {
            createYarnBridge({
              connectionId: connection.id,
              piece1Id: snapInfo.movingPoint.pieceId,
              piece2Id: snapInfo.targetPoint.pieceId,
              point1: snapInfo.movingPoint,
              point2: snapInfo.targetPoint,
              mesh1: snapInfo.movingPoint.mesh,
              mesh2: snapInfo.targetPoint.mesh
            });
          }
        }
      };
      
      // Hook into magnetic snap events
      window.addEventListener('magnetic-snap-complete', (e) => {
        handleSnapComplete(e.detail);
      });
    }
    
    // Listen for piece movement to update bridges
    const handlePieceMove = (event) => {
      const { piece, mesh } = event.detail;
      if (manager && piece) {
        manager.updatePieceBridges(piece.id, mesh);
      }
    };
    
    window.addEventListener('connection-created', handleConnectionCreated);
    window.addEventListener('connection-removed', handleConnectionRemoved);
    window.addEventListener('piece-moved', handlePieceMove);
    window.addEventListener('piece-drag', handlePieceMove);
    
    return () => {
      window.removeEventListener('connection-created', handleConnectionCreated);
      window.removeEventListener('connection-removed', handleConnectionRemoved);
      window.removeEventListener('piece-moved', handlePieceMove);
      window.removeEventListener('piece-drag', handlePieceMove);
      
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, [scene, assembly, magneticSnapManager]);
  
  // Create a yarn bridge
  const createYarnBridge = useCallback((connectionData) => {
    if (managerRef.current) {
      const bridge = managerRef.current.createBridge(connectionData);
      updateStats();
      return bridge;
    }
    return null;
  }, []);
  
  // Remove a yarn bridge
  const removeYarnBridge = useCallback((connectionId) => {
    if (managerRef.current) {
      managerRef.current.removeBridge(connectionId);
      updateStats();
    }
  }, []);
  
  // Update bridge for moved pieces
  const updateBridge = useCallback((connectionId, newPositions) => {
    if (managerRef.current) {
      managerRef.current.updateBridge(connectionId, newPositions);
      updateStats();
    }
  }, []);
  
  // Toggle visibility of all bridges
  const toggleBridgesVisible = useCallback(() => {
    const newVisible = !bridgesVisible;
    setBridgesVisible(newVisible);
    if (managerRef.current) {
      managerRef.current.setVisible(newVisible);
    }
  }, [bridgesVisible]);
  
  // Update yarn color
  const updateYarnColor = useCallback((color) => {
    setYarnColor(color);
    if (managerRef.current) {
      managerRef.current.updateConfig({ yarnColor: color });
    }
  }, []);
  
  // Update yarn thickness
  const updateYarnThickness = useCallback((thickness) => {
    setYarnThickness(thickness);
    if (managerRef.current) {
      managerRef.current.updateConfig({ yarnThickness: thickness });
      // Rebuild all bridges with new thickness
      rebuildAllBridges();
    }
  }, []);
  
  // Update yarn sag
  const updateYarnSag = useCallback((sag) => {
    setYarnSag(sag);
    if (managerRef.current) {
      managerRef.current.updateConfig({ yarnSag: sag });
      // Rebuild all bridges with new sag
      rebuildAllBridges();
    }
  }, []);
  
  // Toggle creation animation
  const toggleAnimateCreation = useCallback(() => {
    const newAnimate = !animateCreation;
    setAnimateCreation(newAnimate);
    if (managerRef.current) {
      managerRef.current.updateConfig({ animateCreation: newAnimate });
    }
  }, [animateCreation]);
  
  // Highlight bridges for a specific piece
  const highlightPieceBridges = useCallback((pieceId, highlight = true) => {
    if (managerRef.current) {
      managerRef.current.highlightPieceBridges(pieceId, highlight);
    }
  }, []);
  
  // Rebuild all bridges (for config changes)
  const rebuildAllBridges = useCallback(() => {
    if (!managerRef.current) return;
    
    const manager = managerRef.current;
    const bridges = Array.from(manager.bridges.values());
    
    // Store bridge data
    const bridgeData = bridges.map(bridge => ({
      connectionId: bridge.id,
      piece1Id: bridge.piece1.id,
      piece2Id: bridge.piece2.id,
      point1: bridge.piece1.point,
      point2: bridge.piece2.point,
      mesh1: bridge.piece1.mesh,
      mesh2: bridge.piece2.mesh
    }));
    
    // Clear and recreate
    manager.clearAll();
    bridgeData.forEach(data => {
      manager.createBridge(data);
    });
    
    updateStats();
  }, []);
  
  // Clear all bridges
  const clearAllBridges = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clearAll();
      updateStats();
    }
  }, []);
  
  // Update statistics
  const updateStats = useCallback(() => {
    if (managerRef.current) {
      const stats = managerRef.current.getStats();
      setBridgeStats(stats);
    }
  }, []);
  
  // Get bridges for a specific piece
  const getPieceBridges = useCallback((pieceId) => {
    if (!managerRef.current) return [];
    
    const bridgeIds = managerRef.current.pieceBridges.get(pieceId);
    if (!bridgeIds) return [];
    
    return Array.from(bridgeIds).map(id => 
      managerRef.current.bridges.get(id)
    ).filter(Boolean);
  }, []);
  
  // Check if two pieces are connected
  const arePiecesConnected = useCallback((piece1Id, piece2Id) => {
    if (!managerRef.current) return false;
    
    const bridges1 = managerRef.current.pieceBridges.get(piece1Id) || new Set();
    const bridges2 = managerRef.current.pieceBridges.get(piece2Id) || new Set();
    
    // Check if they share any bridges
    for (const bridgeId of bridges1) {
      if (bridges2.has(bridgeId)) return true;
    }
    
    return false;
  }, []);
  
  return {
    // State
    bridgesVisible,
    yarnColor,
    yarnThickness,
    yarnSag,
    animateCreation,
    bridgeStats,
    
    // Methods
    createYarnBridge,
    removeYarnBridge,
    updateBridge,
    toggleBridgesVisible,
    updateYarnColor,
    updateYarnThickness,
    updateYarnSag,
    toggleAnimateCreation,
    highlightPieceBridges,
    clearAllBridges,
    getPieceBridges,
    arePiecesConnected,
    
    // Reference to manager (for advanced use)
    manager: managerRef.current
  };
}

export default useYarnBridge;

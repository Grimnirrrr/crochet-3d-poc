// src/hooks/useConnectionManager.js

import { useState, useCallback, useRef } from 'react';

/**
 * D2: Connection Manager Hook
 * Manages connection state and operations for the UI
 */

export function useConnectionManager(assembly, onAssemblyUpdate) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionPreview, setConnectionPreview] = useState(null);
  const [connectionHistory, setConnectionHistory] = useState([]);
  
  const pendingConnection = useRef(null);

  /**
   * Toggle connection mode
   */
  const toggleConnectionMode = useCallback(() => {
    setConnectionMode(prev => !prev);
    setSelectedPoint(null);
    setConnectionPreview(null);
  }, []);

  /**
   * Select a connection point
   */
  const selectPoint = useCallback((point) => {
    if (!connectionMode) return;
    
    if (!selectedPoint) {
      // First point selection
      setSelectedPoint(point);
      findCompatiblePoints(point);
    } else if (selectedPoint.pointId === point.pointId) {
      // Deselect same point
      setSelectedPoint(null);
      setConnectionPreview(null);
    } else {
      // Second point - attempt connection
      attemptConnection(selectedPoint, point);
    }
  }, [selectedPoint, connectionMode, assembly]);

  /**
   * Find compatible points for selected point
   */
  const findCompatiblePoints = useCallback((point) => {
    if (!assembly) return [];
    
    const compatible = [];
    
    assembly.pieces.forEach(piece => {
      if (piece.id === point.pieceId) return;
      
      piece.connectionPoints?.forEach(cp => {
        if (cp.isOccupied) return;
        
        // Check compatibility both ways
        const isCompatible = 
          point.compatible?.includes(cp.name) ||
          point.compatible?.includes(cp.type) ||
          cp.compatible?.includes(point.name) ||
          cp.compatible?.includes(point.type) ||
          point.compatible?.includes('universal') ||
          cp.compatible?.includes('universal');
        
        if (isCompatible) {
          compatible.push({
            ...cp,
            pieceId: piece.id,
            pieceName: piece.name
          });
        }
      });
    });
    
    return compatible;
  }, [assembly]);

  /**
   * Preview connection between points
   */
  const previewConnection = useCallback((fromPoint, toPoint) => {
    if (!fromPoint || !toPoint) {
      setConnectionPreview(null);
      return;
    }
    
    setConnectionPreview({
      from: fromPoint,
      to: toPoint,
      valid: canConnect(fromPoint, toPoint)
    });
  }, [assembly]);

  /**
   * Check if two points can connect
   */
  const canConnect = useCallback((point1, point2) => {
    if (!assembly) return false;
    
    // Use assembly's validation
    const validation = assembly.canConnect(
      point1.pieceId,
      point1.pointId || point1.id,
      point2.pieceId,
      point2.pointId || point2.id
    );
    
    return validation.valid;
  }, [assembly]);

  /**
   * Attempt to connect two points
   */
  const attemptConnection = useCallback((fromPoint, toPoint) => {
    if (!assembly) return;
    
    const result = assembly.connect(
      fromPoint.pieceId,
      fromPoint.pointId || fromPoint.id,
      toPoint.pieceId,
      toPoint.pointId || toPoint.id
    );
    
    if (result.success) {
      // Add to history
      setConnectionHistory(prev => [...prev, {
        id: `conn_${Date.now()}`,
        from: fromPoint,
        to: toPoint,
        timestamp: Date.now()
      }]);
      
      // Update assembly
      if (onAssemblyUpdate) {
        onAssemblyUpdate(assembly);
      }
      
      // Show success feedback
      showConnectionFeedback(true, 'Connected successfully!');
    } else {
      // Show error feedback
      showConnectionFeedback(false, result.message || 'Connection failed');
      
      // Show upgrade prompt if needed
      if (result.showUpgrade && result.upgradePrompt) {
        showUpgradePrompt(result.upgradePrompt);
      }
    }
    
    // Clear selection
    setSelectedPoint(null);
    setConnectionPreview(null);
  }, [assembly, onAssemblyUpdate]);

  /**
   * Disconnect two pieces
   */
  const disconnect = useCallback((connectionId) => {
    if (!assembly) return;
    
    const success = assembly.disconnect(connectionId);
    
    if (success) {
      // Update history
      setConnectionHistory(prev => 
        prev.filter(conn => conn.id !== connectionId)
      );
      
      // Update assembly
      if (onAssemblyUpdate) {
        onAssemblyUpdate(assembly);
      }
      
      showConnectionFeedback(true, 'Disconnected successfully');
    } else {
      showConnectionFeedback(false, 'Failed to disconnect');
    }
  }, [assembly, onAssemblyUpdate]);

  /**
   * Show connection feedback
   */
  const showConnectionFeedback = useCallback((success, message) => {
    // This would typically trigger a toast or notification
    console.log(`Connection ${success ? 'SUCCESS' : 'FAILED'}: ${message}`);
  }, []);

  /**
   * Show upgrade prompt
   */
  const showUpgradePrompt = useCallback((prompt) => {
    console.log('Upgrade required:', prompt);
    // This would typically show a modal or dialog
  }, []);

  /**
   * Get connection statistics
   */
  const getConnectionStats = useCallback(() => {
    if (!assembly) return null;
    
    let totalConnections = 0;
    let occupiedPoints = 0;
    let availablePoints = 0;
    
    assembly.pieces.forEach(piece => {
      piece.connectionPoints?.forEach(point => {
        if (point.isOccupied) {
          occupiedPoints++;
        } else {
          availablePoints++;
        }
      });
    });
    
    totalConnections = assembly.connections?.length || 0;
    
    return {
      totalConnections,
      occupiedPoints,
      availablePoints,
      totalPoints: occupiedPoints + availablePoints
    };
  }, [assembly]);

  /**
   * Auto-connect compatible pieces
   */
  const autoConnect = useCallback(() => {
    if (!assembly) return;
    
    const suggestions = [];
    let connectionsMade = 0;
    
    assembly.pieces.forEach(piece1 => {
      piece1.connectionPoints?.forEach(point1 => {
        if (point1.isOccupied) return;
        
        assembly.pieces.forEach(piece2 => {
          if (piece1.id === piece2.id) return;
          
          piece2.connectionPoints?.forEach(point2 => {
            if (point2.isOccupied) return;
            
            if (canConnect(
              { ...point1, pieceId: piece1.id },
              { ...point2, pieceId: piece2.id }
            )) {
              suggestions.push({
                from: { ...point1, pieceId: piece1.id, pieceName: piece1.name },
                to: { ...point2, pieceId: piece2.id, pieceName: piece2.name },
                confidence: calculateConnectionConfidence(point1, point2)
              });
            }
          });
        });
      });
    });
    
    // Sort by confidence and connect the best matches
    suggestions.sort((a, b) => b.confidence - a.confidence);
    
    for (const suggestion of suggestions.slice(0, 3)) { // Connect up to 3
      const result = assembly.connect(
        suggestion.from.pieceId,
        suggestion.from.id,
        suggestion.to.pieceId,
        suggestion.to.id
      );
      
      if (result.success) {
        connectionsMade++;
      }
    }
    
    if (connectionsMade > 0) {
      showConnectionFeedback(true, `Auto-connected ${connectionsMade} pieces`);
      if (onAssemblyUpdate) {
        onAssemblyUpdate(assembly);
      }
    } else {
      showConnectionFeedback(false, 'No compatible connections found');
    }
    
    return connectionsMade;
  }, [assembly, onAssemblyUpdate, canConnect, showConnectionFeedback]);

  /**
   * Calculate connection confidence score
   */
  const calculateConnectionConfidence = (point1, point2) => {
    let confidence = 0.5;
    
    // Exact name match is highest confidence
    if (point1.compatible?.includes(point2.name) && 
        point2.compatible?.includes(point1.name)) {
      confidence = 1.0;
    }
    // One-way match
    else if (point1.compatible?.includes(point2.name) || 
             point2.compatible?.includes(point1.name)) {
      confidence = 0.8;
    }
    // Type match
    else if (point1.type && point2.type && 
             (point1.compatible?.includes(point2.type) || 
              point2.compatible?.includes(point1.type))) {
      confidence = 0.7;
    }
    
    return confidence;
  };

  /**
   * Clear all connections
   */
  const clearAllConnections = useCallback(() => {
    if (!assembly || !assembly.connections) return;
    
    const count = assembly.connections.length;
    
    // Disconnect all
    [...assembly.connections].forEach(conn => {
      assembly.disconnect(conn.id);
    });
    
    setConnectionHistory([]);
    
    if (onAssemblyUpdate) {
      onAssemblyUpdate(assembly);
    }
    
    showConnectionFeedback(true, `Cleared ${count} connections`);
  }, [assembly, onAssemblyUpdate, showConnectionFeedback]);

  return {
    // State
    selectedPoint,
    hoveredPoint,
    connectionMode,
    connectionPreview,
    connectionHistory,
    
    // Actions
    toggleConnectionMode,
    selectPoint,
    setHoveredPoint,
    previewConnection,
    attemptConnection,
    disconnect,
    autoConnect,
    clearAllConnections,
    
    // Utilities
    findCompatiblePoints,
    canConnect,
    getConnectionStats
  };
}

// src/hooks/useMagneticSnap.js
// React hook for magnetic snap integration

import { useEffect, useRef, useState, useCallback } from 'react';
import { MagneticSnapManager } from '../utils/magneticSnapManager';

export function useMagneticSnap(scene, assembly, dragDropManager) {
  const managerRef = useRef(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapDistance, setSnapDistance] = useState(1.0);
  const [snapStrength, setSnapStrength] = useState(0.2);
  const [isSnapping, setIsSnapping] = useState(false);
  const [snapStats, setSnapStats] = useState({
    registeredPieces: 0,
    activeConnections: 0,
    snapHistory: 0,
    lastSnap: null
  });
  
  // Initialize magnetic snap manager
  useEffect(() => {
    if (!scene || !assembly) return;
    
    // Create manager
    const manager = new MagneticSnapManager(scene, assembly);
    managerRef.current = manager;
    
    // Set initial config
    manager.updateConfig({
      enabled: snapEnabled,
      snapDistance: snapDistance,
      snapStrength: snapStrength
    });
    
    // Listen for drag events if drag & drop manager exists
    if (dragDropManager) {
      const handleDrag = (event) => {
        const { mesh, position } = event.detail;
        
        // Check for snap opportunities while dragging
        const snapInfo = manager.updateSnapDetection(mesh, position);
        
        // Apply magnetic pull if within range
        if (snapInfo && snapInfo.distance < snapDistance) {
          const pullStrength = 1 - (snapInfo.distance / snapDistance);
          const magneticPull = pullStrength * snapStrength;
          
          // Adjust position toward snap point
          mesh.position.lerp(snapInfo.snapPosition, magneticPull);
        }
      };
      
      const handleDragEnd = (event) => {
        const { mesh } = event.detail;
        
        // Check if we should snap
        const snapInfo = manager.updateSnapDetection(mesh, mesh.position);
        
        if (snapInfo && snapInfo.distance < snapDistance * 0.5) {
          // Close enough - execute snap
          setIsSnapping(true);
          manager.executeSnap(mesh, snapInfo, () => {
            setIsSnapping(false);
            updateStats();
            console.log('Magnetic snap completed');
          });
        }
      };
      
      window.addEventListener('piece-drag', handleDrag);
      window.addEventListener('piece-dragend', handleDragEnd);
      
      return () => {
        window.removeEventListener('piece-drag', handleDrag);
        window.removeEventListener('piece-dragend', handleDragEnd);
      };
    }
    
    return () => {
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, [scene, assembly, dragDropManager, snapEnabled, snapDistance, snapStrength]);
  
  // Register a piece for magnetic snap
  const registerSnapPiece = useCallback((mesh, pieceData) => {
    if (managerRef.current) {
      managerRef.current.registerPiece(mesh, pieceData);
      updateStats();
    }
  }, []);
  
  // Unregister a piece
  const unregisterSnapPiece = useCallback((mesh) => {
    if (managerRef.current) {
      managerRef.current.unregisterPiece(mesh);
      updateStats();
    }
  }, []);
  
  // Toggle magnetic snap
  const toggleSnap = useCallback(() => {
    const newEnabled = !snapEnabled;
    setSnapEnabled(newEnabled);
    if (managerRef.current) {
      managerRef.current.setEnabled(newEnabled);
    }
  }, [snapEnabled]);
  
  // Update snap distance
  const updateSnapDistance = useCallback((distance) => {
    setSnapDistance(distance);
    if (managerRef.current) {
      managerRef.current.updateConfig({ snapDistance: distance });
    }
  }, []);
  
  // Update snap strength
  const updateSnapStrength = useCallback((strength) => {
    setSnapStrength(strength);
    if (managerRef.current) {
      managerRef.current.updateConfig({ snapStrength: strength });
    }
  }, []);
  
  // Manually trigger snap check
  const checkForSnap = useCallback((mesh, position) => {
    if (managerRef.current) {
      return managerRef.current.updateSnapDetection(mesh, position);
    }
    return null;
  }, []);
  
  // Execute manual snap
  const executeManualSnap = useCallback((mesh, snapInfo, onComplete) => {
    if (managerRef.current && snapInfo) {
      setIsSnapping(true);
      managerRef.current.executeSnap(mesh, snapInfo, () => {
        setIsSnapping(false);
        updateStats();
        if (onComplete) onComplete();
      });
    }
  }, []);
  
  // Update statistics
  const updateStats = useCallback(() => {
    if (managerRef.current) {
      const stats = managerRef.current.getStats();
      setSnapStats(stats);
    }
  }, []);
  
  // Get compatible connection points for a piece
  const getCompatiblePoints = useCallback((mesh) => {
    if (!managerRef.current) return [];
    
    const compatible = [];
    const piecePoints = managerRef.current.connectionPoints.get(mesh);
    
    if (piecePoints) {
      managerRef.current.connectionPoints.forEach((targetPoints, targetMesh) => {
        if (targetMesh === mesh) return;
        
        targetPoints.forEach(targetPoint => {
          if (targetPoint.occupied) return;
          
          piecePoints.forEach(piecePoint => {
            if (piecePoint.occupied) return;
            
            if (managerRef.current.arePointsCompatible(piecePoint, targetPoint)) {
              compatible.push({
                source: piecePoint,
                target: targetPoint,
                targetMesh: targetMesh
              });
            }
          });
        });
      });
    }
    
    return compatible;
  }, []);
  
  // Clear all connections
  const clearConnections = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.activeConnections.clear();
      managerRef.current.snapHistory = [];
      updateStats();
    }
  }, []);
  
  return {
    // State
    snapEnabled,
    snapDistance,
    snapStrength,
    isSnapping,
    snapStats,
    
    // Methods
    registerSnapPiece,
    unregisterSnapPiece,
    toggleSnap,
    updateSnapDistance,
    updateSnapStrength,
    checkForSnap,
    executeManualSnap,
    getCompatiblePoints,
    clearConnections,
    
    // Reference to manager (for advanced use)
    manager: managerRef.current
  };
}

export default useMagneticSnap;

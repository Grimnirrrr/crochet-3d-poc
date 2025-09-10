// src/components/ConnectionPointsUI.jsx

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PieceFactory } from '../models/pieceFactory';

/**
 * D2: Connection Points UI
 * Visual indicators and interactions for piece connection points
 */

export function ConnectionPointsUI({ 
  scene, 
  camera, 
  assembly, 
  onConnectionSelect,
  currentTier = 'freemium' 
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [compatiblePoints, setCompatiblePoints] = useState([]);
  const [connectionInfo, setConnectionInfo] = useState(null);
  
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const pieceFactory = useRef(new PieceFactory());
  const pointIndicators = useRef(new Map()); // Map of point ID to mesh
  const connectionLines = useRef([]);

  /**
   * Create visual indicators for all connection points
   */
  useEffect(() => {
    if (!scene || !assembly) return;

    // Clear existing indicators
    pointIndicators.current.forEach(mesh => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    pointIndicators.current.clear();

    // Create indicators for each piece's connection points
    assembly.pieces.forEach(piece => {
      piece.connectionPoints?.forEach(point => {
        const indicator = createConnectionIndicator(point, piece);
        scene.add(indicator);
        pointIndicators.current.set(point.id, indicator);
      });
    });

    return () => {
      // Cleanup on unmount
      pointIndicators.current.forEach(mesh => {
        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
    };
  }, [scene, assembly]);

  /**
   * Create a connection point indicator
   */
  function createConnectionIndicator(point, piece) {
    const group = new THREE.Group();
    
    // Main sphere indicator
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: point.isOccupied ? 0xff4444 : 0x44ff44,
      emissive: point.isOccupied ? 0x220000 : 0x002200,
      transparent: true,
      opacity: 0.8
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    
    // Position based on piece position + connection offset
    const piecePos = piece.position || { x: 0, y: 0, z: 0 };
    const pointPos = point.position || { x: 0, y: 0, z: 0 };
    sphere.position.set(
      piecePos.x + pointPos.x,
      piecePos.y + pointPos.y,
      piecePos.z + pointPos.z
    );
    
    // Add ring for visibility
    const ringGeometry = new THREE.TorusGeometry(0.12, 0.02, 8, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(sphere.position);
    
    // Add label
    const label = createTextLabel(point.name, sphere.position);
    
    // Store metadata
    sphere.userData = {
      type: 'connectionPoint',
      pointId: point.id,
      pieceId: piece.id,
      pointName: point.name,
      compatible: point.compatible,
      isOccupied: point.isOccupied
    };
    
    group.add(sphere);
    group.add(ring);
    if (label) group.add(label);
    group.name = `indicator_${point.id}`;
    
    return group;
  }

  /**
   * Create text label for connection point
   */
  function createTextLabel(text, position) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 256, 64);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 0.2;
    sprite.scale.set(0.5, 0.125, 1);
    
    return sprite;
  }

  /**
   * Handle mouse move for hover effects
   */
  function handleMouseMove(event) {
    if (!camera || !scene) return;
    
    // Calculate mouse position in normalized device coordinates
    const rect = event.target.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera);
    
    // Find intersected objects
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    // Find connection point intersections
    let foundPoint = null;
    for (const intersect of intersects) {
      if (intersect.object.userData.type === 'connectionPoint') {
        foundPoint = intersect.object.userData;
        break;
      }
    }
    
    // Update hover state
    if (foundPoint && foundPoint.pointId !== hoveredPoint?.pointId) {
      setHoveredPoint(foundPoint);
      highlightPoint(foundPoint.pointId, true);
      
      // Show compatible points if this point is selected
      if (selectedPoint) {
        showCompatiblePoints(foundPoint);
      }
    } else if (!foundPoint && hoveredPoint) {
      highlightPoint(hoveredPoint.pointId, false);
      setHoveredPoint(null);
    }
  }

  /**
   * Handle click on connection point
   */
  function handleClick(event) {
    if (!hoveredPoint) return;
    
    if (!selectedPoint) {
      // First selection
      setSelectedPoint(hoveredPoint);
      highlightSelectedPoint(hoveredPoint.pointId, true);
      findCompatiblePoints(hoveredPoint);
    } else if (selectedPoint.pointId === hoveredPoint.pointId) {
      // Deselect
      highlightSelectedPoint(selectedPoint.pointId, false);
      setSelectedPoint(null);
      clearCompatibleHighlights();
    } else {
      // Second selection - attempt connection
      if (canConnect(selectedPoint, hoveredPoint)) {
        // Notify parent component of connection attempt
        if (onConnectionSelect) {
          onConnectionSelect({
            from: selectedPoint,
            to: hoveredPoint
          });
        }
        
        // Create visual connection
        createConnectionVisual(selectedPoint, hoveredPoint);
      }
      
      // Clear selection
      highlightSelectedPoint(selectedPoint.pointId, false);
      setSelectedPoint(null);
      clearCompatibleHighlights();
    }
  }

  /**
   * Highlight a connection point
   */
  function highlightPoint(pointId, highlight) {
    const indicator = pointIndicators.current.get(pointId);
    if (!indicator) return;
    
    const sphere = indicator.children[0];
    if (sphere && sphere.material) {
      if (highlight) {
        sphere.material.emissive = new THREE.Color(0x444400);
        sphere.material.emissiveIntensity = 0.5;
        sphere.scale.set(1.2, 1.2, 1.2);
      } else {
        sphere.material.emissive = new THREE.Color(
          sphere.userData.isOccupied ? 0x220000 : 0x002200
        );
        sphere.material.emissiveIntensity = 0.3;
        sphere.scale.set(1, 1, 1);
      }
    }
  }

  /**
   * Highlight selected point
   */
  function highlightSelectedPoint(pointId, selected) {
    const indicator = pointIndicators.current.get(pointId);
    if (!indicator) return;
    
    const sphere = indicator.children[0];
    if (sphere && sphere.material) {
      if (selected) {
        sphere.material.color = new THREE.Color(0xffff00);
        sphere.material.emissive = new THREE.Color(0x444400);
        sphere.scale.set(1.3, 1.3, 1.3);
      } else {
        sphere.material.color = new THREE.Color(
          sphere.userData.isOccupied ? 0xff4444 : 0x44ff44
        );
        sphere.material.emissive = new THREE.Color(
          sphere.userData.isOccupied ? 0x220000 : 0x002200
        );
        sphere.scale.set(1, 1, 1);
      }
    }
  }

  /**
   * Find and highlight compatible points
   */
  function findCompatiblePoints(point) {
    const compatible = [];
    
    assembly.pieces.forEach(piece => {
      if (piece.id === point.pieceId) return; // Skip same piece
      
      piece.connectionPoints?.forEach(cp => {
        if (cp.isOccupied) return; // Skip occupied points
        
        // Check compatibility
        if (point.compatible.includes(cp.name) || 
            point.compatible.includes(cp.type) ||
            cp.compatible.includes(point.pointName) ||
            cp.compatible.includes(point.type)) {
          compatible.push(cp.id);
          highlightCompatible(cp.id, true);
        }
      });
    });
    
    setCompatiblePoints(compatible);
  }

  /**
   * Highlight compatible point
   */
  function highlightCompatible(pointId, highlight) {
    const indicator = pointIndicators.current.get(pointId);
    if (!indicator) return;
    
    const sphere = indicator.children[0];
    const ring = indicator.children[1];
    
    if (highlight) {
      if (sphere && sphere.material) {
        sphere.material.color = new THREE.Color(0x00ffff);
        sphere.material.emissive = new THREE.Color(0x004444);
      }
      if (ring && ring.material) {
        ring.material.color = new THREE.Color(0x00ffff);
        ring.material.opacity = 0.8;
      }
    } else {
      if (sphere && sphere.material) {
        sphere.material.color = new THREE.Color(
          sphere.userData.isOccupied ? 0xff4444 : 0x44ff44
        );
        sphere.material.emissive = new THREE.Color(
          sphere.userData.isOccupied ? 0x220000 : 0x002200
        );
      }
      if (ring && ring.material) {
        ring.material.color = new THREE.Color(0xffffff);
        ring.material.opacity = 0.5;
      }
    }
  }

  /**
   * Clear all compatible highlights
   */
  function clearCompatibleHighlights() {
    compatiblePoints.forEach(pointId => {
      highlightCompatible(pointId, false);
    });
    setCompatiblePoints([]);
  }

  /**
   * Check if two points can connect
   */
  function canConnect(point1, point2) {
    // Check basic compatibility
    return point1.compatible.includes(point2.pointName) ||
           point2.compatible.includes(point1.pointName) ||
           point1.compatible.includes('universal') ||
           point2.compatible.includes('universal');
  }

  /**
   * Create visual connection between points
   */
  function createConnectionVisual(point1, point2) {
    const indicator1 = pointIndicators.current.get(point1.pointId);
    const indicator2 = pointIndicators.current.get(point2.pointId);
    
    if (!indicator1 || !indicator2) return;
    
    const pos1 = indicator1.children[0].position;
    const pos2 = indicator2.children[0].position;
    
    // Create connection line
    const line = pieceFactory.current.createYarnBridge(pos1, pos2, '#8b4513');
    scene.add(line);
    connectionLines.current.push(line);
  }

  /**
   * Component cleanup
   */
  useEffect(() => {
    return () => {
      // Clean up connection lines
      connectionLines.current.forEach(line => {
        scene.remove(line);
        if (line.geometry) line.geometry.dispose();
        if (line.material) line.material.dispose();
      });
      
      // Clean up factory
      pieceFactory.current.dispose();
    };
  }, [scene]);

  return (
    <div 
      className="connection-ui-overlay"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    >
      {/* Connection Info Panel */}
      {hoveredPoint && (
        <div className="connection-info" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          pointerEvents: 'none'
        }}>
          <h4 style={{ margin: '0 0 5px 0' }}>Connection Point</h4>
          <p style={{ margin: '2px 0' }}>Name: {hoveredPoint.pointName}</p>
          <p style={{ margin: '2px 0' }}>Status: {hoveredPoint.isOccupied ? 'Occupied' : 'Available'}</p>
          <p style={{ margin: '2px 0' }}>Compatible: {hoveredPoint.compatible.join(', ')}</p>
        </div>
      )}
      
      {/* Selection Instructions */}
      {selectedPoint && (
        <div className="selection-info" style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 0, 0.9)',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontWeight: 'bold'
        }}>
          Selected: {selectedPoint.pointName} - Click compatible point to connect
        </div>
      )}
    </div>
  );
}

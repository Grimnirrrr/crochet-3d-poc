// src/utils/magneticSnapManager.js
// D4: Magnetic Snap functionality for automatic piece connection

import * as THREE from 'three';
import { toSafeVector3 } from './safeTypes';

export class MagneticSnapManager {
  constructor(scene, assembly) {
    this.scene = scene;
    this.assembly = assembly;
    
    // Snap configuration
    this.config = {
      enabled: true,
      snapDistance: 1.0,  // Distance at which snapping activates
      snapStrength: 0.2,  // How strongly pieces pull together (0-1)
      visualFeedback: true,
      autoConnect: true,  // Automatically create connection when snapped
      snapPreview: true   // Show preview of where piece will snap
    };
    
    // Connection point tracking
    this.connectionPoints = new Map();  // mesh -> points array
    this.activeConnections = new Set(); // Track connected pairs
    this.snapCandidates = new Map();    // Current potential snaps
    
    // Visual indicators
    this.indicators = {
      snapZones: new Map(),      // Visual snap zones around points
      connectionLines: new Map(), // Preview lines showing potential connections
      magneticField: null        // Optional field visualization
    };
    
    // Snap state
    this.isSnapping = false;
    this.currentSnapPair = null;
    this.snapHistory = [];
    
    // Performance optimization
    this.spatialIndex = new Map(); // Spatial partitioning for efficiency
    this.lastUpdateTime = 0;
    this.updateInterval = 100; // ms between spatial updates
  }
  
  // Register a piece with its connection points
  registerPiece(mesh, pieceData) {
    if (!mesh || !pieceData || !pieceData.connectionPoints) return;
    
    // Convert connection points to world coordinates
    const worldPoints = pieceData.connectionPoints.map(point => {
      const worldPos = new THREE.Vector3(
        point.position.x,
        point.position.y,
        point.position.z
      );
      
      // Transform to world space
      mesh.localToWorld(worldPos);
      
      return {
        id: point.id,
        type: point.type,
        worldPosition: worldPos,
        localPosition: point.position,
        compatible: point.compatible || [],
        occupied: point.occupied || false,
        pieceId: pieceData.id,
        mesh: mesh
      };
    });
    
    this.connectionPoints.set(mesh, worldPoints);
    
    // Create visual indicators if enabled
    if (this.config.visualFeedback) {
      this.createSnapIndicators(mesh, worldPoints);
    }
    
    // Update spatial index
    this.updateSpatialIndex(mesh, worldPoints);
  }
  
  // Unregister a piece
  unregisterPiece(mesh) {
    if (!mesh) return;
    
    // Clean up visual indicators
    const snapZones = this.indicators.snapZones.get(mesh);
    if (snapZones) {
      snapZones.forEach(zone => {
        this.scene.remove(zone);
        zone.geometry.dispose();
        zone.material.dispose();
      });
      this.indicators.snapZones.delete(mesh);
    }
    
    // Remove from tracking
    this.connectionPoints.delete(mesh);
    this.snapCandidates.delete(mesh);
    
    // Remove from spatial index
    this.spatialIndex.forEach((meshes, key) => {
      const filtered = meshes.filter(m => m !== mesh);
      if (filtered.length > 0) {
        this.spatialIndex.set(key, filtered);
      } else {
        this.spatialIndex.delete(key);
      }
    });
  }
  
  // Update snap detection for a moving piece
  updateSnapDetection(movingMesh, newPosition) {
    if (!this.config.enabled || !movingMesh) return null;
    
    const movingPoints = this.connectionPoints.get(movingMesh);
    if (!movingPoints) return null;
    
    let closestSnap = null;
    let minDistance = this.config.snapDistance;
    
    // Check against all other pieces' connection points
    for (const [targetMesh, targetPoints] of this.connectionPoints) {
      if (targetMesh === movingMesh) continue;
      
      // Check each connection point pair
      for (const movingPoint of movingPoints) {
        if (movingPoint.occupied) continue;
        
        for (const targetPoint of targetPoints) {
          if (targetPoint.occupied) continue;
          
          // Check compatibility
          if (!this.arePointsCompatible(movingPoint, targetPoint)) continue;
          
          // Calculate distance
          const distance = this.calculateSnapDistance(
            movingPoint,
            targetPoint,
            newPosition,
            targetMesh.position
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestSnap = {
              movingPoint: movingPoint,
              targetPoint: targetPoint,
              distance: distance,
              snapPosition: this.calculateSnapPosition(
                movingPoint,
                targetPoint,
                newPosition,
                targetMesh.position
              )
            };
          }
        }
      }
    }
    
    // Update snap candidates
    if (closestSnap) {
      this.snapCandidates.set(movingMesh, closestSnap);
      this.showSnapPreview(closestSnap);
    } else {
      this.snapCandidates.delete(movingMesh);
      this.hideSnapPreview();
    }
    
    return closestSnap;
  }
  
  // Check if two connection points are compatible
  arePointsCompatible(point1, point2) {
    // Check if types are compatible
    if (point1.compatible.includes(point2.type) || 
        point2.compatible.includes(point1.type)) {
      return true;
    }
    
    // Check specific compatibility rules
    if (point1.type === 'neck' && point2.type === 'neck_joint') return true;
    if (point1.type === 'neck_joint' && point2.type === 'neck') return true;
    if (point1.type === 'shoulder' && point2.type === 'arm_top') return true;
    if (point1.type === 'arm_top' && point2.type === 'shoulder') return true;
    
    return false;
  }
  
  // Calculate distance between potential snap points
  calculateSnapDistance(movingPoint, targetPoint, movingPosition, targetPosition) {
    // Calculate where the moving point would be in world space
    const movingWorldPos = new THREE.Vector3(
      movingPosition.x + movingPoint.localPosition.x,
      movingPosition.y + movingPoint.localPosition.y,
      movingPosition.z + movingPoint.localPosition.z
    );
    
    // Calculate target point world position
    const targetWorldPos = new THREE.Vector3(
      targetPosition.x + targetPoint.localPosition.x,
      targetPosition.y + targetPoint.localPosition.y,
      targetPosition.z + targetPoint.localPosition.z
    );
    
    return movingWorldPos.distanceTo(targetWorldPos);
  }
  
  // Calculate the position where piece should snap to
  calculateSnapPosition(movingPoint, targetPoint, movingPosition, targetPosition) {
    // Calculate offset to align connection points
    const offset = new THREE.Vector3(
      targetPoint.localPosition.x - movingPoint.localPosition.x,
      targetPoint.localPosition.y - movingPoint.localPosition.y,
      targetPoint.localPosition.z - movingPoint.localPosition.z
    );
    
    // New position for moving piece
    return new THREE.Vector3(
      targetPosition.x - movingPoint.localPosition.x + targetPoint.localPosition.x,
      targetPosition.y - movingPoint.localPosition.y + targetPoint.localPosition.y,
      targetPosition.z - movingPoint.localPosition.z + targetPoint.localPosition.z
    );
  }
  
  // Execute snap animation
  executeSnap(mesh, snapInfo, onComplete) {
    if (this.isSnapping) return;
    
    this.isSnapping = true;
    this.currentSnapPair = snapInfo;
    
    const startPos = mesh.position.clone();
    const endPos = snapInfo.snapPosition;
    const duration = 300; // ms
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth snap
      const easeProgress = this.easeInOutCubic(progress);
      
      // Interpolate position
      mesh.position.lerpVectors(startPos, endPos, easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Snap complete
        this.isSnapping = false;
        
        // Mark points as occupied
        snapInfo.movingPoint.occupied = true;
        snapInfo.targetPoint.occupied = true;
        
        // Create connection in assembly
        if (this.config.autoConnect && this.assembly) {
          this.createConnection(snapInfo);
        }
        
        // Add to history
        this.snapHistory.push({
          timestamp: Date.now(),
          ...snapInfo
        });
        
        // Callback
        if (onComplete) onComplete(snapInfo);
        
        // Hide preview
        this.hideSnapPreview();
        
        console.log('Snap complete:', snapInfo.movingPoint.id, '->', snapInfo.targetPoint.id);
      }
    };
    
    animate();
  }
  
  // Easing function for smooth animation
  easeInOutCubic(t) {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  // Create connection in assembly
  createConnection(snapInfo) {
    if (!this.assembly) return;
    
    const result = this.assembly.connect(
      snapInfo.movingPoint.pieceId,
      snapInfo.movingPoint.id,
      snapInfo.targetPoint.pieceId,
      snapInfo.targetPoint.id
    );
    
    if (result.success) {
      this.activeConnections.add({
        point1: snapInfo.movingPoint,
        point2: snapInfo.targetPoint,
        connectionId: result.connectionId
      });
    }
    
    return result;
  }
  
  // Create visual snap indicators
  createSnapIndicators(mesh, points) {
    const zones = [];
    
    points.forEach(point => {
      // Create snap zone sphere
      const geometry = new THREE.SphereGeometry(this.config.snapDistance * 0.3, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.2,
        wireframe: true
      });
      
      const zone = new THREE.Mesh(geometry, material);
      zone.position.copy(point.localPosition);
      zone.visible = false; // Hidden by default
      
      mesh.add(zone); // Add as child of mesh
      zones.push(zone);
    });
    
    this.indicators.snapZones.set(mesh, zones);
  }
  
  // Show snap preview
  showSnapPreview(snapInfo) {
    if (!this.config.snapPreview) return;
    
    // Clean up existing preview
    this.hideSnapPreview();
    
    // Create connection line preview
    const points = [
      snapInfo.movingPoint.worldPosition,
      snapInfo.targetPoint.worldPosition
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 2,
      transparent: true,
      opacity: 0.6
    });
    
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    
    this.indicators.connectionLines.set('preview', line);
    
    // Highlight snap zones
    this.highlightSnapZones(snapInfo);
  }
  
  // Hide snap preview
  hideSnapPreview() {
    const previewLine = this.indicators.connectionLines.get('preview');
    if (previewLine) {
      this.scene.remove(previewLine);
      previewLine.geometry.dispose();
      previewLine.material.dispose();
      this.indicators.connectionLines.delete('preview');
    }
    
    // Hide all snap zones
    this.indicators.snapZones.forEach(zones => {
      zones.forEach(zone => {
        zone.visible = false;
      });
    });
  }
  
  // Highlight active snap zones
  highlightSnapZones(snapInfo) {
    // Show and pulse the active snap zones
    const movingZones = this.indicators.snapZones.get(snapInfo.movingPoint.mesh);
    const targetZones = this.indicators.snapZones.get(snapInfo.targetPoint.mesh);
    
    if (movingZones) {
      movingZones.forEach(zone => {
        zone.visible = true;
        zone.material.color.setHex(0x00ff00);
      });
    }
    
    if (targetZones) {
      targetZones.forEach(zone => {
        zone.visible = true;
        zone.material.color.setHex(0x00ffff);
      });
    }
  }
  
  // Update spatial index for performance
  updateSpatialIndex(mesh, points) {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) return;
    
    this.lastUpdateTime = now;
    
    // Simple grid-based spatial partitioning
    points.forEach(point => {
      const gridKey = this.getGridKey(point.worldPosition);
      
      if (!this.spatialIndex.has(gridKey)) {
        this.spatialIndex.set(gridKey, []);
      }
      
      const meshes = this.spatialIndex.get(gridKey);
      if (!meshes.includes(mesh)) {
        meshes.push(mesh);
      }
    });
  }
  
  // Get grid key for spatial partitioning
  getGridKey(position) {
    const gridSize = 5; // Size of each grid cell
    const x = Math.floor(position.x / gridSize);
    const y = Math.floor(position.y / gridSize);
    const z = Math.floor(position.z / gridSize);
    return `${x},${y},${z}`;
  }
  
  // Toggle magnetic snap
  setEnabled(enabled) {
    this.config.enabled = enabled;
    
    // Show/hide indicators
    if (!enabled) {
      this.hideSnapPreview();
    }
  }
  
  // Update snap configuration
  updateConfig(config) {
    Object.assign(this.config, config);
  }
  
  // Get snap statistics
  getStats() {
    return {
      enabled: this.config.enabled,
      registeredPieces: this.connectionPoints.size,
      activeConnections: this.activeConnections.size,
      snapHistory: this.snapHistory.length,
      lastSnap: this.snapHistory[this.snapHistory.length - 1] || null
    };
  }
  
  // Cleanup
  dispose() {
    // Clean up all visual indicators
    this.indicators.snapZones.forEach((zones, mesh) => {
      zones.forEach(zone => {
        mesh.remove(zone);
        zone.geometry.dispose();
        zone.material.dispose();
      });
    });
    
    this.indicators.connectionLines.forEach(line => {
      this.scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    
    // Clear all maps
    this.connectionPoints.clear();
    this.activeConnections.clear();
    this.snapCandidates.clear();
    this.indicators.snapZones.clear();
    this.indicators.connectionLines.clear();
    this.spatialIndex.clear();
  }
}

export default MagneticSnapManager;

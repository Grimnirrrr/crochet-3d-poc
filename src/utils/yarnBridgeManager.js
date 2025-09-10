// src/utils/yarnBridgeManager.js
// D5: Visual yarn connections between assembled pieces

import * as THREE from 'three';
import { toSafeVector3 } from './safeTypes';

export class YarnBridgeManager {
  constructor(scene) {
    this.scene = scene;
    
    // Yarn bridge storage
    this.bridges = new Map(); // connectionId -> bridge object
    this.pieceBridges = new Map(); // pieceId -> Set of connectionIds
    
    // Visual configuration
    this.config = {
      enabled: true,
      yarnColor: 0xfbbf24,
      yarnThickness: 0.05,
      yarnSegments: 20,
      yarnSag: 0.1, // How much yarn sags between points
      animateCreation: true,
      animationDuration: 500, // ms
      glowEffect: true,
      pulseOnCreate: true
    };
    
    // Yarn materials
    this.materials = {
      default: null,
      highlighted: null,
      creating: null
    };
    
    // Animation tracking
    this.animatingBridges = new Set();
    this.pulsingBridges = new Set();
    
    // Statistics
    this.stats = {
      totalBridges: 0,
      activeBridges: 0,
      totalYarnLength: 0
    };
    
    this.initializeMaterials();
  }
  
  // Initialize yarn materials
  initializeMaterials() {
    // Default yarn material
    this.materials.default = new THREE.MeshPhongMaterial({
      color: this.config.yarnColor,
      emissive: this.config.yarnColor,
      emissiveIntensity: 0.1,
      shininess: 30,
      side: THREE.DoubleSide
    });
    
    // Highlighted yarn material
    this.materials.highlighted = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
      shininess: 50,
      side: THREE.DoubleSide
    });
    
    // Creating animation material
    this.materials.creating = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
  }
  
  // Create a yarn bridge between two points
  createBridge(connectionData) {
    const {
      connectionId,
      piece1Id,
      piece2Id,
      point1,
      point2,
      mesh1,
      mesh2
    } = connectionData;
    
    if (!connectionId || this.bridges.has(connectionId)) {
      console.warn('Bridge already exists or invalid connection');
      return null;
    }
    
    // Calculate world positions
    const worldPos1 = this.getWorldPosition(mesh1, point1.position);
    const worldPos2 = this.getWorldPosition(mesh2, point2.position);
    
    // Create curved yarn path
    const curve = this.createYarnCurve(worldPos1, worldPos2);
    
    // Create tube geometry for yarn
    const geometry = new THREE.TubeGeometry(
      curve,
      this.config.yarnSegments,
      this.config.yarnThickness,
      8,
      false
    );
    
    // Create mesh
    const material = this.config.animateCreation 
      ? this.materials.creating.clone()
      : this.materials.default.clone();
    
    const yarnMesh = new THREE.Mesh(geometry, material);
    yarnMesh.castShadow = true;
    yarnMesh.receiveShadow = true;
    yarnMesh.userData = {
      connectionId,
      piece1Id,
      piece2Id,
      point1Id: point1.id,
      point2Id: point2.id
    };
    
    // Create bridge object
    const bridge = {
      id: connectionId,
      mesh: yarnMesh,
      curve: curve,
      startPoint: worldPos1,
      endPoint: worldPos2,
      piece1: { id: piece1Id, mesh: mesh1, point: point1 },
      piece2: { id: piece2Id, mesh: mesh2, point: point2 },
      length: curve.getLength(),
      created: Date.now()
    };
    
    // Store bridge
    this.bridges.set(connectionId, bridge);
    
    // Track by piece
    if (!this.pieceBridges.has(piece1Id)) {
      this.pieceBridges.set(piece1Id, new Set());
    }
    if (!this.pieceBridges.has(piece2Id)) {
      this.pieceBridges.set(piece2Id, new Set());
    }
    this.pieceBridges.get(piece1Id).add(connectionId);
    this.pieceBridges.get(piece2Id).add(connectionId);
    
    // Add to scene
    this.scene.add(yarnMesh);
    
    // Animate if enabled
    if (this.config.animateCreation) {
      this.animateBridgeCreation(bridge);
    }
    
    // Pulse effect
    if (this.config.pulseOnCreate) {
      this.pulseBridge(bridge);
    }
    
    // Update stats
    this.stats.totalBridges++;
    this.stats.activeBridges++;
    this.stats.totalYarnLength += bridge.length;
    
    console.log(`Yarn bridge created: ${connectionId}`);
    return bridge;
  }
  
  // Create curved yarn path with sag
  createYarnCurve(start, end) {
    const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
    
    // Add sag to middle point
    midPoint.y -= this.config.yarnSag;
    
    // Add slight random offset for organic look
    midPoint.x += (Math.random() - 0.5) * 0.02;
    midPoint.z += (Math.random() - 0.5) * 0.02;
    
    // Create catmull-rom curve for smooth yarn
    const curve = new THREE.CatmullRomCurve3([
      start.clone(),
      midPoint,
      end.clone()
    ]);
    
    curve.tension = 0.5; // Adjust tension for yarn stiffness
    
    return curve;
  }
  
  // Get world position from mesh and local position
  getWorldPosition(mesh, localPosition) {
    const worldPos = new THREE.Vector3(
      localPosition.x || 0,
      localPosition.y || 0,
      localPosition.z || 0
    );
    
    // Transform to world space
    if (mesh && mesh.localToWorld) {
      mesh.localToWorld(worldPos);
    } else if (mesh && mesh.position) {
      worldPos.add(mesh.position);
    }
    
    return worldPos;
  }
  
  // Animate bridge creation
  animateBridgeCreation(bridge) {
    if (this.animatingBridges.has(bridge.id)) return;
    
    this.animatingBridges.add(bridge.id);
    
    const startTime = Date.now();
    const duration = this.config.animationDuration;
    const mesh = bridge.mesh;
    
    // Start with zero scale
    mesh.scale.set(0.01, 0.01, 0.01);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Scale up
      const scale = 0.01 + (0.99 * easeProgress);
      mesh.scale.set(1, scale, scale);
      
      // Fade in
      if (mesh.material.opacity !== undefined) {
        mesh.material.opacity = easeProgress;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        mesh.scale.set(1, 1, 1);
        mesh.material = this.materials.default.clone();
        this.animatingBridges.delete(bridge.id);
      }
    };
    
    animate();
  }
  
  // Pulse effect for new bridge
  pulseBridge(bridge) {
    if (this.pulsingBridges.has(bridge.id)) return;
    
    this.pulsingBridges.add(bridge.id);
    
    const startTime = Date.now();
    const duration = 1000;
    const mesh = bridge.mesh;
    const originalEmissive = mesh.material.emissiveIntensity || 0.1;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        // Sine wave pulse
        const pulse = Math.sin(progress * Math.PI * 3) * 0.5 + 0.5;
        mesh.material.emissiveIntensity = originalEmissive + (pulse * 0.3);
        requestAnimationFrame(animate);
      } else {
        // Reset
        mesh.material.emissiveIntensity = originalEmissive;
        this.pulsingBridges.delete(bridge.id);
      }
    };
    
    animate();
  }
  
  // Update bridge when pieces move
  updateBridge(connectionId, newPositions) {
    const bridge = this.bridges.get(connectionId);
    if (!bridge) return;
    
    const { mesh1, mesh2 } = newPositions;
    
    // Calculate new world positions
    const worldPos1 = this.getWorldPosition(mesh1, bridge.piece1.point.position);
    const worldPos2 = this.getWorldPosition(mesh2, bridge.piece2.point.position);
    
    // Create new curve
    const newCurve = this.createYarnCurve(worldPos1, worldPos2);
    
    // Update geometry
    const oldGeometry = bridge.mesh.geometry;
    const newGeometry = new THREE.TubeGeometry(
      newCurve,
      this.config.yarnSegments,
      this.config.yarnThickness,
      8,
      false
    );
    
    bridge.mesh.geometry = newGeometry;
    oldGeometry.dispose();
    
    // Update bridge data
    bridge.curve = newCurve;
    bridge.startPoint = worldPos1;
    bridge.endPoint = worldPos2;
    bridge.length = newCurve.getLength();
    
    // Update stats
    this.updateTotalYarnLength();
  }
  
  // Update all bridges for a moving piece
  updatePieceBridges(pieceId, mesh) {
    const bridgeIds = this.pieceBridges.get(pieceId);
    if (!bridgeIds) return;
    
    bridgeIds.forEach(connectionId => {
      const bridge = this.bridges.get(connectionId);
      if (bridge) {
        const mesh1 = bridge.piece1.id === pieceId ? mesh : bridge.piece1.mesh;
        const mesh2 = bridge.piece2.id === pieceId ? mesh : bridge.piece2.mesh;
        this.updateBridge(connectionId, { mesh1, mesh2 });
      }
    });
  }
  
  // Remove a bridge
  removeBridge(connectionId) {
    const bridge = this.bridges.get(connectionId);
    if (!bridge) return;
    
    // Remove from scene
    this.scene.remove(bridge.mesh);
    
    // Dispose geometry and material
    bridge.mesh.geometry.dispose();
    bridge.mesh.material.dispose();
    
    // Remove from tracking
    this.bridges.delete(connectionId);
    this.pieceBridges.get(bridge.piece1.id)?.delete(connectionId);
    this.pieceBridges.get(bridge.piece2.id)?.delete(connectionId);
    
    // Update stats
    this.stats.activeBridges--;
    this.updateTotalYarnLength();
    
    console.log(`Yarn bridge removed: ${connectionId}`);
  }
  
  // Highlight bridges for a specific piece
  highlightPieceBridges(pieceId, highlight = true) {
    const bridgeIds = this.pieceBridges.get(pieceId);
    if (!bridgeIds) return;
    
    bridgeIds.forEach(connectionId => {
      const bridge = this.bridges.get(connectionId);
      if (bridge) {
        bridge.mesh.material = highlight 
          ? this.materials.highlighted.clone()
          : this.materials.default.clone();
      }
    });
  }
  
  // Update total yarn length stat
  updateTotalYarnLength() {
    this.stats.totalYarnLength = 0;
    this.bridges.forEach(bridge => {
      this.stats.totalYarnLength += bridge.length;
    });
  }
  
  // Get statistics
  getStats() {
    return {
      ...this.stats,
      averageLength: this.stats.activeBridges > 0 
        ? this.stats.totalYarnLength / this.stats.activeBridges 
        : 0
    };
  }
  
  // Toggle yarn visibility
  setVisible(visible) {
    this.bridges.forEach(bridge => {
      bridge.mesh.visible = visible;
    });
  }
  
  // Update configuration
  updateConfig(config) {
    Object.assign(this.config, config);
    
    // Update materials if color changed
    if (config.yarnColor !== undefined) {
      this.materials.default.color.setHex(config.yarnColor);
      this.materials.default.emissive.setHex(config.yarnColor);
    }
  }
  
  // Clear all bridges
  clearAll() {
    this.bridges.forEach((bridge, connectionId) => {
      this.removeBridge(connectionId);
    });
    
    this.bridges.clear();
    this.pieceBridges.clear();
    this.stats.activeBridges = 0;
    this.stats.totalYarnLength = 0;
  }
  
  // Cleanup
  dispose() {
    this.clearAll();
    
    // Dispose materials
    Object.values(this.materials).forEach(material => {
      if (material) material.dispose();
    });
  }
}

export default YarnBridgeManager;

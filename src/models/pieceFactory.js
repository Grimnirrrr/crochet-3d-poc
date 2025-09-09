// src/models/pieceFactory.js

import * as THREE from 'three';
import { toSafeVector3 } from '../utils/safeTypes';

/**
 * D1: Piece Factory - Generates 3D meshes from piece templates
 * Creates visual representations while keeping data separate
 */

export class PieceFactory {
  constructor() {
    this.materials = this.createMaterials();
    this.geometryCache = new Map();
  }

  /**
   * Create reusable materials
   */
  createMaterials() {
    return {
      default: new THREE.MeshPhongMaterial({
        color: 0xfbbf24,
        shininess: 30,
        flatShading: false
      }),
      selected: new THREE.MeshPhongMaterial({
        color: 0xfbbf24,
        emissive: 0x444444,
        shininess: 50
      }),
      preview: new THREE.MeshPhongMaterial({
        color: 0xffffff,
        opacity: 0.5,
        transparent: true
      }),
      error: new THREE.MeshPhongMaterial({
        color: 0xef4444,
        emissive: 0x441111
      })
    };
  }

  /**
   * Generate 3D mesh from piece data
   */
  createPieceMesh(piece) {
    const group = new THREE.Group();
    group.name = `piece_${piece.id}`;
    
    // Create main body from pattern
    const bodyMesh = this.createBodyFromPattern(piece.rounds || piece.pattern, piece.color);
    group.add(bodyMesh);
    
    // Add connection point indicators
    if (piece.connectionPoints) {
      piece.connectionPoints.forEach(cp => {
        const indicator = this.createConnectionIndicator(cp);
        group.add(indicator);
      });
    }
    
    // Store reference to piece data (but not the data itself)
    group.userData = {
      pieceId: piece.id,
      pieceType: piece.type,
      pieceName: piece.name
    };
    
    return group;
  }

  /**
   * Create body mesh from crochet pattern
   */
  createBodyFromPattern(pattern, color = '#fbbf24') {
    if (!pattern || pattern.length === 0) {
      // Fallback to simple sphere
      return this.createDefaultShape(color);
    }

    // Generate vertices from pattern
    const shape = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8, pattern.length);
    const vertices = shape.attributes.position;
    
    // Modify vertices based on pattern
    for (let roundIndex = 0; roundIndex < pattern.length; roundIndex++) {
      const round = pattern[roundIndex];
      const radius = this.calculateRadius(round.stitches);
      const y = (roundIndex / pattern.length - 0.5) * 2; // Normalize to -1 to 1
      
      // Update vertices for this round
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const vertexIndex = roundIndex * 8 + i;
        
        if (vertexIndex * 3 < vertices.count * 3) {
          vertices.setXYZ(
            vertexIndex,
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius
          );
        }
      }
    }
    
    // Update normals
    shape.computeVertexNormals();
    
    // Create mesh
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      shininess: 30,
      flatShading: false
    });
    
    const mesh = new THREE.Mesh(shape, material);
    return mesh;
  }

  /**
   * Calculate radius from stitch count
   */
  calculateRadius(stitches) {
    // Approximate radius based on stitches
    // Real crochet: circumference = stitches * stitch_width
    // radius = circumference / (2 * PI)
    const stitchWidth = 0.05; // Approximate width per stitch
    const circumference = stitches * stitchWidth;
    return circumference / (2 * Math.PI);
  }

  /**
   * Create default shape when no pattern available
   */
  createDefaultShape(color) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      shininess: 30
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create connection point indicator
   */
  createConnectionIndicator(connectionPoint) {
    const group = new THREE.Group();
    
    // Main indicator sphere
    const geometry = new THREE.SphereGeometry(0.08, 8, 8);
    const material = new THREE.MeshPhongMaterial({
      color: connectionPoint.isOccupied ? 0xff0000 : 0x00ff00,
      emissive: connectionPoint.isOccupied ? 0x440000 : 0x004400,
      transparent: true,
      opacity: 0.8
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    
    // Position from safe vector
    const pos = toSafeVector3(connectionPoint.position);
    sphere.position.set(pos.x, pos.y, pos.z);
    
    // Add ring for better visibility
    const ringGeometry = new THREE.TorusGeometry(0.1, 0.02, 8, 16);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x222222
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(sphere.position);
    
    // Store connection point data
    sphere.userData = {
      connectionId: connectionPoint.id,
      connectionName: connectionPoint.name,
      isOccupied: connectionPoint.isOccupied
    };
    
    group.add(sphere);
    group.add(ring);
    group.name = `connection_${connectionPoint.id}`;
    
    return group;
  }

  /**
   * Create preview mesh for drag & drop
   */
  createPreviewMesh(piece) {
    const mesh = this.createPieceMesh(piece);
    
    // Make it semi-transparent
    mesh.traverse(child => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.5;
      }
    });
    
    return mesh;
  }

  /**
   * Update connection point visual state
   */
  updateConnectionIndicator(mesh, connectionId, isOccupied, isHighlighted = false) {
    const indicator = mesh.getObjectByName(`connection_${connectionId}`);
    if (!indicator) return;
    
    const sphere = indicator.children[0];
    if (sphere && sphere.isMesh) {
      if (isHighlighted) {
        sphere.material.color.setHex(0xffff00); // Yellow for highlighted
        sphere.material.emissive.setHex(0x444400);
      } else {
        sphere.material.color.setHex(isOccupied ? 0xff0000 : 0x00ff00);
        sphere.material.emissive.setHex(isOccupied ? 0x440000 : 0x004400);
      }
    }
  }

  /**
   * Highlight compatible connection points
   */
  highlightCompatiblePoints(mesh, compatibleTypes) {
    mesh.traverse(child => {
      if (child.userData.connectionName) {
        const isCompatible = compatibleTypes.includes(child.userData.connectionName);
        if (child.isMesh) {
          child.material.emissive = new THREE.Color(isCompatible ? 0x00ff00 : 0x000000);
          child.material.emissiveIntensity = isCompatible ? 0.5 : 0;
        }
      }
    });
  }

  /**
   * Create connection line between pieces
   */
  createConnectionLine(point1Pos, point2Pos, color = 0x4444ff) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      point1Pos.x, point1Pos.y, point1Pos.z,
      point2Pos.x, point2Pos.y, point2Pos.z
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2
    });
    
    const line = new THREE.Line(geometry, material);
    line.name = 'connection_line';
    
    return line;
  }

  /**
   * Create yarn texture between connected pieces
   */
  createYarnBridge(point1Pos, point2Pos, color = '#8b4513') {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(point1Pos.x, point1Pos.y, point1Pos.z),
      new THREE.Vector3(
        (point1Pos.x + point2Pos.x) / 2,
        (point1Pos.y + point2Pos.y) / 2 - 0.1, // Slight sag
        (point1Pos.z + point2Pos.z) / 2
      ),
      new THREE.Vector3(point2Pos.x, point2Pos.y, point2Pos.z)
    ]);
    
    const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.02, 8, false);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      shininess: 10
    });
    
    const yarn = new THREE.Mesh(tubeGeometry, material);
    yarn.name = 'yarn_bridge';
    
    return yarn;
  }

  /**
   * Dispose of geometries and materials
   */
  dispose() {
    // Dispose cached geometries
    this.geometryCache.forEach(geometry => {
      geometry.dispose();
    });
    this.geometryCache.clear();
    
    // Dispose materials
    Object.values(this.materials).forEach(material => {
      material.dispose();
    });
  }

  /**
   * Create visual feedback for tier restrictions
   */
  createTierLockOverlay(mesh, tierRequired) {
    const bbox = new THREE.Box3().setFromObject(mesh);
    const size = bbox.getSize(new THREE.Vector3());
    
    // Create lock icon
    const lockGroup = new THREE.Group();
    
    // Lock body
    const bodyGeometry = new THREE.BoxGeometry(size.x * 0.3, size.y * 0.3, 0.01);
    const lockMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.8
    });
    const lockBody = new THREE.Mesh(bodyGeometry, lockMaterial);
    
    // Lock shackle (arc)
    const shackleGeometry = new THREE.TorusGeometry(size.x * 0.15, 0.02, 8, 16, Math.PI);
    const shackle = new THREE.Mesh(shackleGeometry, lockMaterial);
    shackle.position.y = size.y * 0.2;
    
    lockGroup.add(lockBody);
    lockGroup.add(shackle);
    
    // Add tier label
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#666666';
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tierRequired.toUpperCase(), 64, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(size.x * 0.5, size.y * 0.25);
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.y = -size.y * 0.3;
    
    lockGroup.add(label);
    lockGroup.name = 'tier_lock_overlay';
    
    return lockGroup;
  }
}

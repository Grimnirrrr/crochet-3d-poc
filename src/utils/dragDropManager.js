// src/utils/dragDropManager.js
// D3: Drag & Drop functionality for 3D pieces

import * as THREE from 'three';
import { toSafeVector3 } from './safeTypes';

export class DragDropManager {
  constructor(camera, renderer, scene) {
    this.camera = camera;
    this.renderer = renderer;
    this.scene = scene;
    
    // Drag state
    this.isDragging = false;
    this.draggedObject = null;
    this.draggedPiece = null;
    this.dragPlane = new THREE.Plane();
    this.dragOffset = new THREE.Vector3();
    this.dragStartPos = new THREE.Vector3();
    
    // Interaction helpers
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.intersection = new THREE.Vector3();
    
    // Visual feedback
    this.highlightColor = 0x00ff00;
    this.dragColor = 0xffff00;
    this.originalColors = new Map();
    
    // Grid snapping
    this.snapToGrid = true;
    this.gridSize = 0.5;
    
    // Constraints
    this.dragConstraints = {
      minY: 0,  // Don't allow dragging below ground
      maxDistance: 20,  // Maximum distance from origin
      lockY: false  // Option to lock vertical movement
    };
    
    // Drag indicators
    this.dragIndicators = {
      ghost: null,  // Ghost preview of final position
      line: null,   // Line showing drag direction
      grid: null    // Visual grid helper
    };
    
    // Piece registry
    this.draggablePieces = new Map();  // mesh -> piece mapping
    this.pieceHighlights = new Map();  // piece -> highlight state
    
    this.setupEventListeners();
  }
  
  // Register a piece as draggable
  registerPiece(mesh, pieceData) {
    if (!mesh || !pieceData) return;
    
    this.draggablePieces.set(mesh, pieceData);
    mesh.userData.isDraggable = true;
    mesh.userData.pieceId = pieceData.id;
    
    // Store original color for restoration
    if (mesh.material) {
      this.originalColors.set(mesh, mesh.material.color.clone());
    }
  }
  
  // Unregister a piece
  unregisterPiece(mesh) {
    if (!mesh) return;
    
    this.draggablePieces.delete(mesh);
    this.originalColors.delete(mesh);
    this.pieceHighlights.delete(mesh);
    
    delete mesh.userData.isDraggable;
    delete mesh.userData.pieceId;
  }
  
  // Setup mouse/touch event listeners
  setupEventListeners() {
    const domElement = this.renderer.domElement;
    
    // Mouse events
    domElement.addEventListener('mousedown', this.onPointerDown.bind(this));
    domElement.addEventListener('mousemove', this.onPointerMove.bind(this));
    domElement.addEventListener('mouseup', this.onPointerUp.bind(this));
    
    // Touch events for mobile
    domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    // Prevent context menu on right click
    domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // Convert touch to mouse coordinates
  getTouchPos(touch, domElement) {
    const rect = domElement.getBoundingClientRect();
    return {
      x: ((touch.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((touch.clientY - rect.top) / rect.height) * 2 + 1
    };
  }
  
  // Touch event handlers
  onTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const pos = this.getTouchPos(event.touches[0], this.renderer.domElement);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.onPointerDown({ button: 0 });
    }
  }
  
  onTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const pos = this.getTouchPos(event.touches[0], this.renderer.domElement);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.onPointerMove();
    }
  }
  
  onTouchEnd(event) {
    event.preventDefault();
    this.onPointerUp();
  }
  
  // Mouse down - start dragging
  onPointerDown(event) {
    // Only left click for drag
    if (event.button !== 0) return;
    
    // Update mouse position for non-touch events
    if (event.clientX !== undefined) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    // Cast ray from camera
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Find draggable objects
    const draggables = Array.from(this.draggablePieces.keys());
    const intersects = this.raycaster.intersectObjects(draggables, true);
    
    if (intersects.length > 0) {
      // Find the nearest draggable parent
      let dragTarget = intersects[0].object;
      while (dragTarget && !dragTarget.userData.isDraggable) {
        dragTarget = dragTarget.parent;
      }
      
      if (dragTarget && dragTarget.userData.isDraggable) {
        this.startDrag(dragTarget, intersects[0].point);
      }
    }
  }
  
  // Start dragging a piece
  startDrag(mesh, intersectPoint) {
    this.isDragging = true;
    this.draggedObject = mesh;
    this.draggedPiece = this.draggablePieces.get(mesh);
    
    // Store original position
    this.dragStartPos.copy(mesh.position);
    
    // Create drag plane perpendicular to camera
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    this.dragPlane.setFromNormalAndCoplanarPoint(
      cameraDirection,
      intersectPoint
    );
    
    // Calculate offset
    this.dragOffset.subVectors(mesh.position, intersectPoint);
    
    // Visual feedback
    this.highlightPiece(mesh, this.dragColor);
    this.createDragIndicators(mesh);
    
    // Dispatch custom event
    this.dispatchDragEvent('dragstart', mesh, this.draggedPiece);
  }
  
  // Mouse move - update drag
  onPointerMove(event) {
    // Update mouse position for non-touch events
    if (event && event.clientX !== undefined) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    if (this.isDragging && this.draggedObject) {
      // Update ray
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // Find intersection with drag plane
      if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection)) {
        // Apply offset
        const newPosition = this.intersection.add(this.dragOffset);
        
        // Apply constraints
        newPosition.y = Math.max(this.dragConstraints.minY, newPosition.y);
        
        if (this.dragConstraints.lockY) {
          newPosition.y = this.dragStartPos.y;
        }
        
        if (this.dragConstraints.maxDistance) {
          const distance = newPosition.length();
          if (distance > this.dragConstraints.maxDistance) {
            newPosition.normalize().multiplyScalar(this.dragConstraints.maxDistance);
          }
        }
        
        // Apply grid snapping
        if (this.snapToGrid) {
          newPosition.x = Math.round(newPosition.x / this.gridSize) * this.gridSize;
          newPosition.y = Math.round(newPosition.y / this.gridSize) * this.gridSize;
          newPosition.z = Math.round(newPosition.z / this.gridSize) * this.gridSize;
        }
        
        // Update position
        this.draggedObject.position.copy(newPosition);
        
        // Update indicators
        this.updateDragIndicators(this.draggedObject);
        
        // Dispatch event
        this.dispatchDragEvent('drag', this.draggedObject, this.draggedPiece);
      }
    } else {
      // Hover effect when not dragging
      this.updateHoverEffect();
    }
  }
  
  // Mouse up - stop dragging
  onPointerUp() {
    if (this.isDragging && this.draggedObject) {
      // Remove visual feedback
      this.restorePieceColor(this.draggedObject);
      this.removeDragIndicators();
      
      // Update piece data with safe position
      if (this.draggedPiece) {
        this.draggedPiece.position = toSafeVector3(
          this.draggedObject.position.x,
          this.draggedObject.position.y,
          this.draggedObject.position.z
        );
      }
      
      // Dispatch event
      this.dispatchDragEvent('dragend', this.draggedObject, this.draggedPiece);
      
      // Reset drag state
      this.isDragging = false;
      this.draggedObject = null;
      this.draggedPiece = null;
    }
  }
  
  // Highlight a piece
  highlightPiece(mesh, color) {
    if (mesh.material) {
      mesh.material.color.setHex(color);
      mesh.material.emissive = new THREE.Color(color);
      mesh.material.emissiveIntensity = 0.3;
    }
  }
  
  // Restore original piece color
  restorePieceColor(mesh) {
    const originalColor = this.originalColors.get(mesh);
    if (mesh.material && originalColor) {
      mesh.material.color.copy(originalColor);
      mesh.material.emissive = new THREE.Color(0x000000);
      mesh.material.emissiveIntensity = 0;
    }
  }
  
  // Update hover effect
  updateHoverEffect() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const draggables = Array.from(this.draggablePieces.keys());
    const intersects = this.raycaster.intersectObjects(draggables, true);
    
    // Reset all non-dragged pieces
    for (const [mesh, piece] of this.draggablePieces) {
      if (mesh !== this.draggedObject) {
        const isHovered = intersects.some(i => {
          let obj = i.object;
          while (obj) {
            if (obj === mesh) return true;
            obj = obj.parent;
          }
          return false;
        });
        
        if (isHovered && !this.pieceHighlights.get(mesh)) {
          this.highlightPiece(mesh, this.highlightColor);
          this.pieceHighlights.set(mesh, true);
          this.renderer.domElement.style.cursor = 'grab';
        } else if (!isHovered && this.pieceHighlights.get(mesh)) {
          this.restorePieceColor(mesh);
          this.pieceHighlights.delete(mesh);
          this.renderer.domElement.style.cursor = 'default';
        }
      }
    }
  }
  
  // Create visual indicators during drag
  createDragIndicators(mesh) {
    // Create ghost preview
    if (this.snapToGrid) {
      const geometry = mesh.geometry.clone();
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      this.dragIndicators.ghost = new THREE.Mesh(geometry, material);
      this.scene.add(this.dragIndicators.ghost);
    }
    
    // Create direction line
    const points = [
      this.dragStartPos.clone(),
      mesh.position.clone()
    ];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffff00,
      linewidth: 2
    });
    this.dragIndicators.line = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(this.dragIndicators.line);
  }
  
  // Update drag indicators
  updateDragIndicators(mesh) {
    if (this.dragIndicators.ghost) {
      this.dragIndicators.ghost.position.copy(mesh.position);
    }
    
    if (this.dragIndicators.line) {
      const points = [
        this.dragStartPos.clone(),
        mesh.position.clone()
      ];
      this.dragIndicators.line.geometry.setFromPoints(points);
    }
  }
  
  // Remove drag indicators
  removeDragIndicators() {
    if (this.dragIndicators.ghost) {
      this.scene.remove(this.dragIndicators.ghost);
      this.dragIndicators.ghost.geometry.dispose();
      this.dragIndicators.ghost.material.dispose();
      this.dragIndicators.ghost = null;
    }
    
    if (this.dragIndicators.line) {
      this.scene.remove(this.dragIndicators.line);
      this.dragIndicators.line.geometry.dispose();
      this.dragIndicators.line.material.dispose();
      this.dragIndicators.line = null;
    }
  }
  
  // Dispatch custom drag events
  dispatchDragEvent(type, mesh, piece) {
    const event = new CustomEvent(`piece-${type}`, {
      detail: {
        mesh: mesh,
        piece: piece,
        position: toSafeVector3(mesh.position.x, mesh.position.y, mesh.position.z),
        isDragging: this.isDragging
      }
    });
    window.dispatchEvent(event);
  }
  
  // Enable/disable drag functionality
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled && this.isDragging) {
      this.onPointerUp();
    }
  }
  
  // Toggle grid snapping
  setSnapToGrid(snap, gridSize = 0.5) {
    this.snapToGrid = snap;
    this.gridSize = gridSize;
  }
  
  // Set drag constraints
  setConstraints(constraints) {
    Object.assign(this.dragConstraints, constraints);
  }
  
  // Cleanup
  dispose() {
    const domElement = this.renderer.domElement;
    
    // Remove event listeners
    domElement.removeEventListener('mousedown', this.onPointerDown);
    domElement.removeEventListener('mousemove', this.onPointerMove);
    domElement.removeEventListener('mouseup', this.onPointerUp);
    domElement.removeEventListener('touchstart', this.onTouchStart);
    domElement.removeEventListener('touchmove', this.onTouchMove);
    domElement.removeEventListener('touchend', this.onTouchEnd);
    
    // Clean up indicators
    this.removeDragIndicators();
    
    // Clear maps
    this.draggablePieces.clear();
    this.originalColors.clear();
    this.pieceHighlights.clear();
  }
}

export default DragDropManager;

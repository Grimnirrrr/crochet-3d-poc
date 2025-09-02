import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PatternInput } from './components/PatternInput';
import { ExportControls } from './components/ExportControls';
import { PatternManager } from './components/PatternManager';
import { YarnCalculator } from './components/YarnCalculator';
import { BeginnerGuide } from './components/BeginnerGuide';
import { AccessibilityControls } from './components/AccessibilityControls';

export default function App() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationIdRef = useRef(null);
  const roundGroupsRef = useRef([]);
  const mouseControlsRef = useRef({ targetRotationX: 0, targetRotationY: 0 });
  
  const [currentRound, setCurrentRound] = useState(0);
  const [totalStitches, setTotalStitches] = useState(0);
  
  const [customPattern, setCustomPattern] = useState(null);

  const pattern = customPattern || [
    { round: 1, stitches: 6, instruction: "6 sc in magic ring" },
    { round: 2, stitches: 12, instruction: "2 sc in each (12)" },
    { round: 3, stitches: 18, instruction: "[sc, inc] ×6 (18)" },
    { round: 4, stitches: 24, instruction: "[2 sc, inc] ×6 (24)" },
    { round: 5, stitches: 30, instruction: "[3 sc, inc] ×6 (30)" }
  ];

  const handlePatternParsed = (rounds) => {
    console.log('Pattern parsed:', rounds);
    // Reset the scene first
    resetScene();
    // Set the new pattern
    setCustomPattern(rounds);
  };

  const resetScene = useCallback(() => {
    if (!sceneRef.current) return;
    
    console.log('Resetting scene...');
    
    // Clean up all rounds
    roundGroupsRef.current.forEach(group => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material) {
            child.material.dispose();
          }
        }
      });
      sceneRef.current.remove(group);
    });
    
    roundGroupsRef.current = [];
    setCurrentRound(0);
    setTotalStitches(0);
    setCustomPattern(null);
  }, []);

  // ============================================
  // STITCH AND YARN CREATION FUNCTIONS
  // ============================================
  const createStitch = useCallback((type = 'sc', size = 0.15) => {
    const group = new THREE.Group();
    
    // Main stitch body
    const geometry = new THREE.SphereGeometry(size, 16, 12);
    const color = type === 'inc' ? 0xf59e0b : 0xfbbf24;
    const material = new THREE.MeshPhongMaterial({ 
      color,
      roughness: 0.5,
      metalness: 0.2,
      shininess: 100
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    
    // Add small yarn tail
    const yarnGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.1);
    const yarnMat = new THREE.MeshPhongMaterial({ color: 0xf59e0b });
    const yarnTail = new THREE.Mesh(yarnGeom, yarnMat);
    yarnTail.position.y = -0.1;
    group.add(yarnTail);
    
    return group;
  }, []);
  
  const createYarnConnection = useCallback((start, end, tension = 0.1) => {
    // Create curved path with sag
    const midPoint = new THREE.Vector3(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2 - tension,
      (start.z + end.z) / 2
    );
    
    const curve = new THREE.CatmullRomCurve3([start, midPoint, end]);
    const tubeGeom = new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
    const tubeMat = new THREE.MeshPhongMaterial({ 
      color: 0xfbbf24,
      opacity: 0.9,
      transparent: true
    });
    
    const mesh = new THREE.Mesh(tubeGeom, tubeMat);
    mesh.castShadow = true;
    return mesh;
  }, []);
  
  const createRound = useCallback((roundData, yPosition) => {
    const group = new THREE.Group();
    const { stitches, round } = roundData;
    const stitchObjects = [];
    
    // Calculate radius based on stitch count
    const radius = Math.sqrt(stitches) * 0.3;
    const angleStep = (Math.PI * 2) / stitches;
    
    // Create stitches
    for (let i = 0; i < stitches; i++) {
      const angle = i * angleStep;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Determine if this is an increase stitch
      const isIncrease = round > 1 && i % Math.floor(stitches / 6) === 0;
      const stitch = createStitch(isIncrease ? 'inc' : 'sc');
      
      stitch.position.set(x, yPosition, z);
      
      // Add slight randomization for organic look
      stitch.position.x += (Math.random() - 0.5) * 0.05;
      stitch.position.z += (Math.random() - 0.5) * 0.05;
      stitch.position.y += (Math.random() - 0.5) * 0.02;
      
      stitchObjects.push(stitch);
      group.add(stitch);
    }
    
    // Add horizontal yarn connections between stitches
    for (let i = 0; i < stitchObjects.length; i++) {
      const current = stitchObjects[i];
      const next = stitchObjects[(i + 1) % stitchObjects.length];
      
      const yarn = createYarnConnection(
        current.position.clone(),
        next.position.clone(),
        0.1
      );
      group.add(yarn);
    }
    
    // Store stitch positions for vertical connections
    group.userData = {
      stitchPositions: stitchObjects.map(s => s.position.clone()),
      stitchCount: stitches
    };
    
    return group;
  }, [createStitch, createYarnConnection]);

  // ============================================
  // ADD NEXT ROUND FUNCTION
  // ============================================
  const addNextRound = useCallback(() => {
    if (!sceneRef.current || currentRound >= pattern.length) {
      if (currentRound >= pattern.length) {
        alert('Pattern complete! 🎉');
      }
      return;
    }
    
    const roundData = pattern[currentRound];
    const yPosition = currentRound * 0.4;
    
    console.log(`Adding round ${currentRound + 1}: ${roundData.stitches} stitches`);
    
    const roundGroup = createRound(roundData, yPosition);
    
    // Add vertical connections to previous round
    if (roundGroupsRef.current.length > 0 && currentRound > 0) {
      const prevRound = roundGroupsRef.current[roundGroupsRef.current.length - 1];
      const prevPositions = prevRound.userData.stitchPositions;
      const currPositions = roundGroup.userData.stitchPositions;
      
      // Connect to previous round with vertical yarns
      const connections = Math.min(prevPositions.length, currPositions.length);
      for (let i = 0; i < connections; i++) {
        const fromIdx = i;
        const toIdx = Math.floor(i * currPositions.length / prevPositions.length);
        
        const yarn = createYarnConnection(
          prevPositions[fromIdx],
          currPositions[toIdx],
          0.05
        );
        roundGroup.add(yarn);
      }
    }
    
    // Animate entrance
    roundGroup.scale.set(0, 0, 0);
    sceneRef.current.add(roundGroup);
    
    // Smooth scale animation
    let scale = 0;
    const animateIn = () => {
      scale += 0.05;
      if (scale <= 1) {
        roundGroup.scale.set(scale, scale, scale);
        requestAnimationFrame(animateIn);
      } else {
        roundGroup.scale.set(1, 1, 1);
      }
    };
    animateIn();
    
    roundGroupsRef.current.push(roundGroup);
    setCurrentRound(prev => prev + 1);
    setTotalStitches(prev => prev + roundData.stitches);
  }, [currentRound, pattern, createRound, createYarnConnection]);

  // ============================================
  // INITIALIZE THREE.JS SCENE
  // ============================================
useEffect(() => {
  if (!mountRef.current) return;
  
  // CLEAR ANY EXISTING CANVAS FIRST
  while (mountRef.current.firstChild) {
    mountRef.current.removeChild(mountRef.current.firstChild);
  }
  
  console.log('Initializing Three.js scene...');
  console.log('THREE.REVISION:', THREE.REVISION);
  
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      (mountRef.current.clientWidth) / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 8, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xfbbf24, 0.5);
    pointLight.position.set(-5, 5, -5);
    scene.add(pointLight);
    
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d3748,
      roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x4a5568, 0x2d3748);
    gridHelper.position.y = -0.99;
    scene.add(gridHelper);
    
    // Add magic ring center
    const ringGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16);
    const ringMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xdc2626,
      emissive: 0xdc2626,
      emissiveIntensity: 0.2
    });
    const magicRing = new THREE.Mesh(ringGeometry, ringMaterial);
    magicRing.rotation.x = -Math.PI / 2;
    magicRing.castShadow = true;
    scene.add(magicRing);
    
    // Mouse controls (NO OrbitControls!)
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    
    const handleMouseDown = () => { isMouseDown = true; };
    const handleMouseUp = () => { isMouseDown = false; };
    
    const handleMouseMove = (e) => {
      if (!isMouseDown) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      mouseControlsRef.current.targetRotationY = mouseX * Math.PI;
      mouseControlsRef.current.targetRotationX = mouseY * Math.PI * 0.5;
    };
    
    const handleWheel = (e) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      camera.position.multiplyScalar(1 + e.deltaY * zoomSpeed * 0.01);
      
      // Clamp zoom
      const distance = camera.position.length();
      if (distance < 5) camera.position.normalize().multiplyScalar(5);
      if (distance > 30) camera.position.normalize().multiplyScalar(30);
    };
    
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('wheel', handleWheel);
    
    // Animation loop
    let frameCount = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      frameCount++;
      
      // Smooth camera rotation
      const cameraRadius = camera.position.length();
      const smoothing = 0.05;
      
      const currentRotationY = Math.atan2(camera.position.x, camera.position.z);
      const currentRotationX = Math.asin(camera.position.y / cameraRadius);
      
      const newRotationY = currentRotationY + (mouseControlsRef.current.targetRotationY - currentRotationY) * smoothing;
      const newRotationX = currentRotationX + (mouseControlsRef.current.targetRotationX - currentRotationX) * smoothing;
      
      camera.position.x = Math.sin(newRotationY) * Math.cos(newRotationX) * cameraRadius;
      camera.position.y = Math.sin(newRotationX) * cameraRadius;
      camera.position.z = Math.cos(newRotationY) * Math.cos(newRotationX) * cameraRadius;
      
      camera.lookAt(0, 2, 0);
      
      // Rotate rounds slightly for visual interest
      roundGroupsRef.current.forEach((group, i) => {
        group.rotation.y += 0.001 * (i + 1);
      });
      
      // Memory monitoring every 300 frames (5 seconds at 60fps)
      if (frameCount % 300 === 0) {
        console.log('Memory:', {
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          programs: renderer.info.programs?.length
        });
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      console.log('Cleaning up Three.js...');
      
      cancelAnimationFrame(animationIdRef.current);
      
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      
      // Clean up all objects
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material) {
            child.material.dispose();
          }
        }
      });
      
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []); // Empty dependency array - only run once!

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{
        width: '350px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white',
        overflowY: 'auto',
        boxShadow: '2px 0 10px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: '600' }}>
          🧶 Crochet 3D Visualizer
        </h1>
        
        <div style={{
          padding: '15px',
          background: 'rgba(16, 185, 129, 0.2)',
          borderLeft: '4px solid #10b981',
          borderRadius: '4px',
          marginBottom: '20px',
          fontFamily: '"Courier New", monospace',
          fontSize: '14px'
        }}>
          <div>✅ 3D Engine: Active</div>
          <div>📍 Current Round: {currentRound}/{pattern.length}</div>
          <div>🧵 Total Stitches: {totalStitches}</div>
          <div>💾 THREE.js: r{typeof THREE !== 'undefined' ? THREE.REVISION : '?'}</div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={addNextRound}
            disabled={currentRound >= pattern.length}
            style={{
              flex: 1,
              background: currentRound >= pattern.length ? '#6b7280' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#1f2937',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: currentRound >= pattern.length ? 'not-allowed' : 'pointer',
              opacity: currentRound >= pattern.length ? 0.5 : 1,
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => {
              if (currentRound < pattern.length) {
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Add Round {currentRound + 1}
          </button>
          
          <button
            onClick={resetScene}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Reset
          </button>
        </div>
        
        <h2 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#fbbf24' }}>
          Pattern Input
        </h2>
        <PatternInput 
          onPatternParsed={handlePatternParsed}
          isDisabled={currentRound > 0}
        />
        
        <ExportControls 
          pattern={pattern}
         currentRound={currentRound}
        />
        
        <PatternManager
          onPatternLoad={handlePatternParsed}
          currentPattern={pattern}
        />

        <YarnCalculator 
          pattern={pattern}
        />
        
        <BeginnerGuide 
          pattern={pattern}
          currentRound={currentRound}
        />

<AccessibilityControls />

        <h2 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#fbbf24' }}>
          Pattern {customPattern ? '(Custom)' : '(Default)'}
        </h2>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          {pattern.map((round, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px',
                margin: '5px 0',
                borderRadius: '4px',
                fontFamily: '"Courier New", monospace',
                fontSize: '14px',
                background: idx < currentRound ? 'rgba(16, 185, 129, 0.2)' : 
                          idx === currentRound ? 'rgba(251, 191, 36, 0.2)' : 'transparent',
                borderLeft: idx < currentRound ? '3px solid #10b981' :
                           idx === currentRound ? '3px solid #fbbf24' : '3px solid transparent',
                paddingLeft: '12px'
              }}
            >
              Round {round.round}: {round.instruction}
            </div>
          ))}
        </div>
        
        <h2 style={{ fontSize: '18px', margin: '20px 0 10px', color: '#fbbf24' }}>
          Controls
        </h2>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '15px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          🖱️ Click & drag to rotate<br/>
          📷 Scroll to zoom<br/>
          🧶 Watch yarn connections form<br/>
          ✨ Each round builds on previous
        </div>
        
        <div style={{
          marginTop: '20px',
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: '"Courier New", monospace'
        }}>
          <strong>Debug:</strong><br/>
          No OrbitControls ✓<br/>
          Manual Camera ✓<br/>
          Yarn Links ✓<br/>
          Memory Safe ✓
        </div>
      </div>
      
      <div ref={mountRef} style={{ flex: 1, position: 'relative' }} />
    </div>
  );
}
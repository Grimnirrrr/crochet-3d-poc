import React, { useState } from 'react';

export function IntegrationPlan() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [implementationStatus, setImplementationStatus] = useState({});
  
  // Mark feature as started/completed
  const updateStatus = (featureId, status) => {
    setImplementationStatus(prev => ({
      ...prev,
      [featureId]: status
    }));
    
    // Save to localStorage for persistence
    const updated = { ...implementationStatus, [featureId]: status };
    localStorage.setItem('integrationPlanStatus', JSON.stringify(updated));
  };
  
  // Load saved status on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('integrationPlanStatus');
    if (saved) {
      setImplementationStatus(JSON.parse(saved));
    }
  }, []);
  
  // Quick Win Features (Can implement now)
  const quickWins = [
    {
      id: 'qw-1',
      name: 'Color Changes Support',
      description: 'Add ability to change yarn colors mid-pattern',
      implementation: {
        steps: [
          'Add color field to pattern rounds',
          'Create color picker component',
          'Update material colors in createStitch function',
          'Store color in round userData'
        ],
        code: `// In createStitch function:
const material = new THREE.MeshPhongMaterial({ 
  color: roundData.color || 0xfbbf24,
  roughness: 0.5,
  metalness: 0.2
});`,
        timeEstimate: '2 hours',
        difficulty: 'Easy'
      }
    },
    {
      id: 'qw-2',
      name: '3D Model Export',
      description: 'Export pattern as STL for 3D printing',
      implementation: {
        steps: [
          'Install THREE STLExporter',
          'Add export button to ExportControls',
          'Merge all geometries',
          'Export as binary STL'
        ],
        code: `import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';

function exportSTL(scene) {
  const exporter = new STLExporter();
  const str = exporter.parse(scene);
  const blob = new Blob([str], { type: 'text/plain' });
  // Download blob
}`,
        timeEstimate: '1 hour',
        difficulty: 'Easy'
      }
    },
    {
      id: 'qw-3',
      name: 'Performance Mode',
      description: 'Simplified rendering for large patterns',
      implementation: {
        steps: [
          'Add toggle for performance mode',
          'Use simpler geometries when enabled',
          'Reduce polygon count',
          'Disable shadows in performance mode'
        ],
        code: `// Simplified geometry for performance
const geometry = performanceMode 
  ? new THREE.SphereGeometry(size, 8, 6)  // Low poly
  : new THREE.SphereGeometry(size, 16, 12); // Normal`,
        timeEstimate: '2 hours',
        difficulty: 'Easy'
      }
    }
  ];
  
  // Medium Effort Features
  const mediumFeatures = [
    {
      id: 'mf-1',
      name: 'Yarn Texture Mapping',
      description: 'Realistic yarn textures on stitches',
      implementation: {
        steps: [
          'Source yarn texture images',
          'Create texture loader',
          'Apply textures to materials',
          'Add texture selection UI'
        ],
        code: `const textureLoader = new THREE.TextureLoader();
const yarnTexture = textureLoader.load('/textures/yarn.jpg');
const material = new THREE.MeshPhongMaterial({
  map: yarnTexture,
  bumpMap: yarnTexture,
  bumpScale: 0.05
});`,
        timeEstimate: '4 hours',
        difficulty: 'Medium'
      }
    },
    {
      id: 'mf-2',
      name: 'Animation Timeline',
      description: 'Scrubber to control pattern building',
      implementation: {
        steps: [
          'Store all rounds in state',
          'Create timeline UI component',
          'Implement scrubbing logic',
          'Smooth transitions between states'
        ],
        code: `function showRoundsUpTo(roundIndex) {
  roundGroups.forEach((group, i) => {
    group.visible = i <= roundIndex;
    group.scale.setScalar(i === roundIndex ? 0 : 1);
    // Animate current round
  });
}`,
        timeEstimate: '5 hours',
        difficulty: 'Medium'
      }
    },
    {
      id: 'mf-3',
      name: 'Stitch Variations',
      description: 'Different 3D models for dc, tr, hdc',
      implementation: {
        steps: [
          'Design geometry for each stitch type',
          'Create stitch factory function',
          'Update parser to detect stitch types',
          'Add stitch type selector'
        ],
        code: `function createStitchGeometry(type) {
  switch(type) {
    case 'sc': return new THREE.SphereGeometry(0.15, 16, 12);
    case 'dc': return new THREE.CylinderGeometry(0.1, 0.12, 0.3);
    case 'tr': return new THREE.CylinderGeometry(0.08, 0.1, 0.45);
    default: return new THREE.SphereGeometry(0.15, 16, 12);
  }
}`,
        timeEstimate: '6 hours',
        difficulty: 'Medium'
      }
    }
  ];
  
  // Future Enhancements
  const futureFeatures = [
    {
      id: 'ff-1',
      name: 'React Three Fiber Migration',
      description: 'Migrate to R3F for better React integration',
      benefits: [
        'Declarative 3D scene management',
        'Better React DevTools support',
        'Easier state management',
        'Access to drei helpers'
      ],
      challenges: [
        'Complete rewrite of 3D components',
        'Learning curve for R3F',
        'Potential performance differences'
      ]
    },
    {
      id: 'ff-2',
      name: 'WebXR Support',
      description: 'View patterns in AR/VR',
      benefits: [
        'Immersive pattern viewing',
        'Real-world scale reference',
        'Novel user experience'
      ],
      challenges: [
        'Limited device support',
        'Complex implementation',
        'Performance requirements'
      ]
    }
  ];
  
  // Calculate overall progress
  const totalFeatures = quickWins.length + mediumFeatures.length;
  const completedFeatures = Object.values(implementationStatus).filter(s => s === 'completed').length;
  const progressPercent = Math.round((completedFeatures / totalFeatures) * 100);
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '15px',
      marginTop: '20px'
    }}>
      <h2 style={{ 
        fontSize: '18px', 
        margin: '0 0 15px 0', 
        color: '#fbbf24'
      }}>
        🎯 Day 28: 3D Integration Plan
      </h2>
      
      {/* Overall Progress */}
      <div style={{
        marginBottom: '20px',
        padding: '10px',
        background: 'rgba(99, 102, 241, 0.2)',
        borderRadius: '6px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '5px'
        }}>
          <span style={{ fontSize: '14px' }}>Implementation Progress</span>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {completedFeatures}/{totalFeatures} Features
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>
      
      {/* Quick Wins Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '16px', 
          marginBottom: '10px',
          color: '#10b981'
        }}>
          ⚡ Quick Wins (1-2 hours each)
        </h3>
        {quickWins.map(feature => (
          <div
            key={feature.id}
            style={{
              padding: '10px',
              marginBottom: '10px',
              background: selectedFeature?.id === feature.id
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              border: implementationStatus[feature.id] === 'completed'
                ? '2px solid #10b981'
                : '2px solid transparent'
            }}
            onClick={() => setSelectedFeature(feature)}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ 
                  fontWeight: '600', 
                  fontSize: '14px',
                  marginRight: '10px'
                }}>
                  {feature.name}
                </span>
                {implementationStatus[feature.id] && (
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: implementationStatus[feature.id] === 'completed'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(251, 191, 36, 0.3)',
                    borderRadius: '3px'
                  }}>
                    {implementationStatus[feature.id]}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus(
                    feature.id,
                    implementationStatus[feature.id] === 'completed' 
                      ? 'in-progress' 
                      : 'completed'
                  );
                }}
                style={{
                  padding: '4px 8px',
                  background: implementationStatus[feature.id] === 'completed'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(99, 102, 241, 0.3)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {implementationStatus[feature.id] === 'completed' ? '✓ Done' : 'Mark Done'}
              </button>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              {feature.description}
            </div>
          </div>
        ))}
      </div>
      
      {/* Medium Features Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '16px', 
          marginBottom: '10px',
          color: '#fbbf24'
        }}>
          🔧 Medium Effort (4-6 hours each)
        </h3>
        {mediumFeatures.map(feature => (
          <div
            key={feature.id}
            style={{
              padding: '10px',
              marginBottom: '10px',
              background: selectedFeature?.id === feature.id
                ? 'rgba(251, 191, 36, 0.2)'
                : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              border: implementationStatus[feature.id] === 'completed'
                ? '2px solid #fbbf24'
                : '2px solid transparent'
            }}
            onClick={() => setSelectedFeature(feature)}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ 
                  fontWeight: '600', 
                  fontSize: '14px',
                  marginRight: '10px'
                }}>
                  {feature.name}
                </span>
                {implementationStatus[feature.id] && (
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: implementationStatus[feature.id] === 'completed'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(251, 191, 36, 0.3)',
                    borderRadius: '3px'
                  }}>
                    {implementationStatus[feature.id]}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus(
                    feature.id,
                    implementationStatus[feature.id] === 'completed' 
                      ? 'in-progress' 
                      : 'completed'
                  );
                }}
                style={{
                  padding: '4px 8px',
                  background: implementationStatus[feature.id] === 'completed'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(99, 102, 241, 0.3)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {implementationStatus[feature.id] === 'completed' ? '✓ Done' : 'Mark Done'}
              </button>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              {feature.description}
            </div>
          </div>
        ))}
      </div>
      
      {/* Implementation Details */}
      {selectedFeature && selectedFeature.implementation && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px'
        }}>
          <h4 style={{ 
            fontSize: '14px', 
            marginBottom: '10px',
            color: '#fbbf24'
          }}>
            📋 Implementation: {selectedFeature.name}
          </h4>
          
          <div style={{ marginBottom: '10px' }}>
            <strong style={{ fontSize: '12px' }}>Steps:</strong>
            <ol style={{ 
              margin: '5px 0 0 20px',
              fontSize: '12px',
              opacity: 0.9
            }}>
              {selectedFeature.implementation.steps.map((step, i) => (
                <li key={i} style={{ marginBottom: '3px' }}>{step}</li>
              ))}
            </ol>
          </div>
          
          {selectedFeature.implementation.code && (
            <div style={{ marginBottom: '10px' }}>
              <strong style={{ fontSize: '12px' }}>Sample Code:</strong>
              <pre style={{
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '11px',
                overflow: 'auto',
                marginTop: '5px'
              }}>
                <code>{selectedFeature.implementation.code}</code>
              </pre>
            </div>
          )}
          
          <div style={{ 
            display: 'flex', 
            gap: '15px',
            fontSize: '12px',
            opacity: 0.8
          }}>
            <span>⏱️ {selectedFeature.implementation.timeEstimate}</span>
            <span>📊 {selectedFeature.implementation.difficulty}</span>
          </div>
        </div>
      )}
      
      {/* Future Plans */}
      <div style={{
        marginTop: '20px',
        padding: '10px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <strong>🚀 Future Considerations:</strong>
        <ul style={{ margin: '5px 0 0 20px', opacity: 0.9 }}>
          <li>React Three Fiber migration for better React integration</li>
          <li>WebXR support for AR/VR viewing</li>
          <li>Advanced physics simulation for yarn behavior</li>
          <li>AI-powered pattern generation</li>
        </ul>
      </div>
    </div>
  );
}
import React, { useState } from 'react';

export function LearningResources() {
  const [activeTab, setActiveTab] = useState('threejs');
  const [completedItems, setCompletedItems] = useState([]);
  
  // Mark item as completed
  const toggleComplete = (itemId) => {
    setCompletedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  // Calculate progress
  const calculateProgress = (items) => {
    const completed = items.filter(item => completedItems.includes(item.id)).length;
    return Math.round((completed / items.length) * 100);
  };
  
  // Three.js learning path
  const threejsResources = [
    {
      id: 'three-1',
      title: 'Three.js Fundamentals',
      url: 'https://threejs.org/manual/',
      description: 'Official Three.js manual covering basics',
      difficulty: 'Beginner',
      timeEstimate: '2 hours'
    },
    {
      id: 'three-2',
      title: 'Three.js Journey',
      url: 'https://threejs-journey.com/',
      description: 'Comprehensive course by Bruno Simon',
      difficulty: 'Intermediate',
      timeEstimate: '40 hours',
      note: 'First 5 lessons recommended for your roadmap'
    },
    {
      id: 'three-3',
      title: 'Geometry & Materials',
      url: 'https://threejs.org/docs/#api/en/geometries/BoxGeometry',
      description: 'Understanding different geometries for stitches',
      difficulty: 'Intermediate',
      timeEstimate: '3 hours'
    },
    {
      id: 'three-4',
      title: 'Performance Optimization',
      url: 'https://discoverthreejs.com/tips-and-tricks/',
      description: 'Optimize for 500+ stitches',
      difficulty: 'Advanced',
      timeEstimate: '2 hours'
    },
    {
      id: 'three-5',
      title: 'Instanced Meshes',
      url: 'https://threejs.org/docs/#api/en/objects/InstancedMesh',
      description: 'Efficient rendering for many similar objects',
      difficulty: 'Advanced',
      timeEstimate: '3 hours',
      relevant: true
    }
  ];
  
  // 3D Crochet Libraries Research
  const libraries = [
    {
      id: 'lib-1',
      name: 'Knitty.js',
      url: 'https://github.com/knitty/knitty',
      description: 'JavaScript library for knitting patterns',
      relevance: 'Pattern parsing logic',
      status: 'Active'
    },
    {
      id: 'lib-2',
      name: 'Crochet Charts',
      url: 'https://www.stitchfiddle.com/',
      description: 'Online crochet chart generator',
      relevance: 'Symbol patterns and charting',
      status: 'Commercial'
    },
    {
      id: 'lib-3',
      name: 'React Three Fiber',
      url: 'https://github.com/pmndrs/react-three-fiber',
      description: 'React renderer for Three.js',
      relevance: 'Better React integration',
      status: 'Very Active',
      recommended: true
    },
    {
      id: 'lib-4',
      name: 'Drei',
      url: 'https://github.com/pmndrs/drei',
      description: 'Useful helpers for React Three Fiber',
      relevance: 'Camera controls, loaders, effects',
      status: 'Active'
    }
  ];
  
  // Potential 3D improvements
  const improvements = [
    {
      id: 'imp-1',
      feature: 'Texture Mapping',
      description: 'Add yarn textures to stitches for realism',
      effort: 'Medium',
      impact: 'High',
      implementation: 'Load texture images, apply to materials'
    },
    {
      id: 'imp-2',
      feature: 'Stitch Variations',
      description: 'Different 3D models for dc, tr, etc.',
      effort: 'High',
      impact: 'High',
      implementation: 'Create geometry functions for each stitch type'
    },
    {
      id: 'imp-3',
      feature: 'Color Changes',
      description: 'Support multiple yarn colors in pattern',
      effort: 'Low',
      impact: 'High',
      implementation: 'Add color property to rounds, update materials'
    },
    {
      id: 'imp-4',
      feature: 'Animation Timeline',
      description: 'Scrubber to see pattern build step-by-step',
      effort: 'Medium',
      impact: 'Medium',
      implementation: 'Store animation states, add timeline control'
    },
    {
      id: 'imp-5',
      feature: 'Export 3D Model',
      description: 'Export as STL/OBJ for 3D printing',
      effort: 'Low',
      impact: 'Medium',
      implementation: 'Use THREE.STLExporter'
    },
    {
      id: 'imp-6',
      feature: 'VR/AR Support',
      description: 'View patterns in VR/AR',
      effort: 'Very High',
      impact: 'Low',
      implementation: 'WebXR API integration'
    }
  ];
  
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
        📚 Day 26-27: Learn & Research
      </h2>
      
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '5px',
        marginBottom: '15px'
      }}>
        <button
          onClick={() => setActiveTab('threejs')}
          style={{
            padding: '8px 12px',
            background: activeTab === 'threejs' 
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              : 'rgba(99, 102, 241, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'threejs' ? '600' : '400'
          }}
        >
          Three.js Skills
        </button>
        <button
          onClick={() => setActiveTab('libraries')}
          style={{
            padding: '8px 12px',
            background: activeTab === 'libraries'
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              : 'rgba(99, 102, 241, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'libraries' ? '600' : '400'
          }}
        >
          3D Libraries
        </button>
        <button
          onClick={() => setActiveTab('improvements')}
          style={{
            padding: '8px 12px',
            background: activeTab === 'improvements'
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              : 'rgba(99, 102, 241, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'improvements' ? '600' : '400'
          }}
        >
          Improvements
        </button>
      </div>
      
      {/* Three.js Learning Path */}
      {activeTab === 'threejs' && (
        <div>
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>
              Learning Progress: {calculateProgress(threejsResources)}%
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${calculateProgress(threejsResources)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
          
          {threejsResources.map(resource => (
            <div
              key={resource.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '10px',
                marginBottom: '10px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '6px',
                opacity: completedItems.includes(resource.id) ? 0.7 : 1
              }}
            >
              <input
                type="checkbox"
                checked={completedItems.includes(resource.id)}
                onChange={() => toggleComplete(resource.id)}
                style={{
                  marginRight: '10px',
                  marginTop: '3px',
                  cursor: 'pointer'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#6366f1',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    {resource.title} →
                  </a>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: resource.difficulty === 'Beginner' 
                      ? 'rgba(16, 185, 129, 0.2)'
                      : resource.difficulty === 'Intermediate'
                      ? 'rgba(251, 191, 36, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '3px'
                  }}>
                    {resource.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '3px' }}>
                  {resource.description}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.6 }}>
                  ⏱️ {resource.timeEstimate}
                  {resource.relevant && ' • 🎯 Highly relevant for your app'}
                </div>
                {resource.note && (
                  <div style={{
                    marginTop: '5px',
                    padding: '5px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}>
                    💡 {resource.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 3D Libraries Research */}
      {activeTab === 'libraries' && (
        <div>
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(99, 102, 241, 0.2)',
            borderRadius: '6px',
            fontSize: '13px'
          }}>
            🔍 Researched libraries for 3D crochet visualization
          </div>
          
          {libraries.map(lib => (
            <div
              key={lib.id}
              style={{
                padding: '10px',
                marginBottom: '10px',
                background: lib.recommended 
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(0, 0, 0, 0.2)',
                borderLeft: lib.recommended 
                  ? '3px solid #10b981'
                  : '3px solid transparent',
                borderRadius: '6px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '5px'
              }}>
                <a
                  href={lib.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {lib.name} →
                </a>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  background: lib.status === 'Very Active'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : lib.status === 'Active'
                    ? 'rgba(99, 102, 241, 0.2)'
                    : 'rgba(251, 191, 36, 0.2)',
                  borderRadius: '3px'
                }}>
                  {lib.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '3px' }}>
                {lib.description}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>
                📌 Relevance: {lib.relevance}
              </div>
              {lib.recommended && (
                <div style={{
                  marginTop: '5px',
                  fontSize: '11px',
                  color: '#10b981'
                }}>
                  ✅ Recommended for future migration
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Potential Improvements */}
      {activeTab === 'improvements' && (
        <div>
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(251, 191, 36, 0.2)',
            borderRadius: '6px',
            fontSize: '13px'
          }}>
            🚀 Day 28 Planning: Potential 3D enhancements
          </div>
          
          {improvements.map(imp => (
            <div
              key={imp.id}
              style={{
                padding: '10px',
                marginBottom: '10px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '6px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '5px'
              }}>
                <span style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#fbbf24'
                }}>
                  {imp.feature}
                </span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: imp.effort === 'Low'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : imp.effort === 'Medium'
                      ? 'rgba(251, 191, 36, 0.2)'
                      : imp.effort === 'High'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(139, 92, 246, 0.2)',
                    borderRadius: '3px'
                  }}>
                    Effort: {imp.effort}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: imp.impact === 'High'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : imp.impact === 'Medium'
                      ? 'rgba(251, 191, 36, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '3px'
                  }}>
                    Impact: {imp.impact}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '3px' }}>
                {imp.description}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.6 }}>
                🔧 Implementation: {imp.implementation}
              </div>
            </div>
          ))}
          
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            💡 <strong>Quick Wins:</strong> Color Changes, Export 3D Model<br/>
            🎯 <strong>High Impact:</strong> Texture Mapping, Stitch Variations<br/>
            ⏳ <strong>Future:</strong> VR/AR Support
          </div>
        </div>
      )}
    </div>
  );
}
// src/components/PatternVisualizationUI.jsx
// Visual pattern chart display component

import React, { useState, useEffect } from 'react';

export function PatternVisualizationUI({
  pattern = [],
  visualizer,
  onExport,
  onPatternChange
}) {
  const [chartType, setChartType] = useState('symbol');
  const [showLegend, setShowLegend] = useState(true);
  const [showCounts, setShowCounts] = useState(true);
  const [interactive, setInteractive] = useState(false);
  const [chart, setChart] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  useEffect(() => {
    if (pattern.length > 0 && visualizer) {
      generateChart();
    }
  }, [pattern, chartType, showLegend, showCounts, interactive]);
  
  const generateChart = () => {
    if (!visualizer) return;
    
    try {
      const newChart = visualizer.visualizePattern(pattern, {
        type: chartType,
        showLegend,
        showCounts,
        interactive
      });
      setChart(newChart);
    } catch (error) {
      console.error('Error generating chart:', error);
    }
  };
  
  const handleExport = (format) => {
    if (!chart || !visualizer) return;
    
    const exported = visualizer.exportChart(chart, format);
    onExport?.(exported, format);
  };
  
  const getChartIcon = (type) => {
    const icons = {
      written: '📝',
      symbol: '⭕',
      graph: '📊',
      diagram: '🕸️',
      '3d': '🎲'
    };
    return icons[type] || '📊';
  };
  
  const renderChartTypeSelector = () => (
    <div style={{
      display: 'flex',
      gap: '5px',
      marginBottom: '15px'
    }}>
      {['written', 'symbol', 'graph', 'diagram', '3d'].map(type => (
        <button
          key={type}
          onClick={() => setChartType(type)}
          style={{
            padding: '8px 12px',
            background: chartType === type ? '#2196F3' : 'white',
            color: chartType === type ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '13px'
          }}
        >
          <span>{getChartIcon(type)}</span>
          <span style={{ textTransform: 'capitalize' }}>{type}</span>
        </button>
      ))}
    </div>
  );
  
  const renderWrittenChart = () => {
    if (!chart || chart.type !== 'written') return null;
    
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Written Pattern</h3>
        {chart.rounds.map((round, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '12px',
              padding: '10px',
              background: selectedRound === idx ? '#E3F2FD' : '#f5f5f5',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedRound(selectedRound === idx ? null : idx)}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <strong>Round {round.number}:</strong>
              <span style={{
                background: '#2196F3',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                {round.count} sts
              </span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
              {round.written}
            </div>
            {round.repeat && (
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#666',
                fontStyle: 'italic'
              }}>
                *{round.repeat.pattern.join(', ')}* × {round.repeat.repeats}
              </div>
            )}
          </div>
        ))}
        {chart.totalStitches && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: '#E8F5E9',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            Total Stitches: {chart.totalStitches}
          </div>
        )}
      </div>
    );
  };
  
  const renderSymbolChart = () => {
    if (!chart || chart.type !== 'symbol') return null;
    
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Symbol Chart</h3>
        <div 
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center',
            transition: 'transform 0.3s ease',
            display: 'inline-block'
          }}
          dangerouslySetInnerHTML={{ __html: chart.svg }}
        />
        <div style={{
          marginTop: '15px',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          alignItems: 'center'
        }}>
          <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
            style={zoomButtonStyle}>−</button>
          <span style={{ fontSize: '14px' }}>Zoom: {(zoomLevel * 100).toFixed(0)}%</span>
          <button onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
            style={zoomButtonStyle}>+</button>
        </div>
      </div>
    );
  };
  
  const renderGraphChart = () => {
    if (!chart || chart.type !== 'graph') return null;
    
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Graph Chart</h3>
        <div style={{
          display: 'inline-block',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '10px',
          background: '#f9f9f9'
        }}>
          {chart.grid.map((row, rIdx) => (
            <div key={rIdx} style={{ display: 'flex', gap: '2px' }}>
              {row.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  style={{
                    width: '25px',
                    height: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: cell.type === 'empty' ? 'transparent' : 'white',
                    border: cell.type === 'stitch' ? '1px solid #ddd' : 'none',
                    borderRadius: '3px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: cell.color || '#333',
                    cursor: cell.type === 'stitch' ? 'pointer' : 'default'
                  }}
                  title={cell.stitch}
                >
                  {cell.symbol}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          marginTop: '10px',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          {chart.height} rounds × {chart.width} stitches max
        </div>
      </div>
    );
  };
  
  const renderDiagram = () => {
    if (!chart || chart.type !== 'diagram') return null;
    
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Stitch Diagram</h3>
        <div style={{
          position: 'relative',
          width: '400px',
          height: '400px',
          margin: '0 auto',
          background: '#f9f9f9',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Draw connections */}
          <svg
            width="400"
            height="400"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {chart.connections.map((conn, idx) => {
              const from = chart.elements.find(e => e.id === conn.from);
              const to = chart.elements.find(e => e.id === conn.to);
              if (!from || !to) return null;
              
              return (
                <line
                  key={idx}
                  x1={from.position.x}
                  y1={from.position.y}
                  x2={to.position.x}
                  y2={to.position.y}
                  stroke={conn.type === 'next-stitch' ? '#ddd' : '#bbb'}
                  strokeWidth="1"
                  strokeDasharray={conn.type === 'next-stitch' ? '2,2' : 'none'}
                />
              );
            })}
          </svg>
          
          {/* Draw elements */}
          {chart.elements.map(element => (
            <div
              key={element.id}
              style={{
                position: 'absolute',
                left: element.position.x - 12,
                top: element.position.y - 12,
                width: '24px',
                height: '24px',
                background: 'white',
                border: `2px solid ${element.color}`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                zIndex: 1
              }}
              title={`Round ${element.round}: ${element.stitch}`}
            >
              {element.symbol}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const render3DVisualization = () => {
    if (!chart || chart.type !== '3d') return null;
    
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>3D Visualization</h3>
        <div style={{
          width: '400px',
          height: '400px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <div>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎲</div>
            <div>3D View</div>
            <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
              {chart.layers.length} layers · {chart.mesh.vertices.length} vertices
            </div>
          </div>
        </div>
        <div style={{
          marginTop: '15px',
          fontSize: '12px',
          color: '#666'
        }}>
          Interactive 3D view would require Three.js integration
        </div>
      </div>
    );
  };
  
  const renderLegend = () => {
    if (!showLegend || !chart?.legend) return null;
    
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '15px',
        marginTop: '15px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Stitch Legend</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px'
        }}>
          {chart.legend.map(item => (
            <div
              key={item.stitch}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px',
                background: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '13px'
              }}
            >
              <span style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
                border: `2px solid ${item.color}`,
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                {item.symbol}
              </span>
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.abbr}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>{item.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderStitchCounts = () => {
    if (!showCounts || !chart?.counts) return null;
    
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '15px',
        marginTop: '15px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Stitch Counts</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '8px'
        }}>
          {Object.entries(chart.counts.byStitch).map(([stitch, count]) => (
            <div
              key={stitch}
              style={{
                textAlign: 'center',
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: '4px'
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{count}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{stitch}</div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {chart.counts.percentage[stitch]}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: '10px',
          padding: '8px',
          background: '#E3F2FD',
          borderRadius: '4px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          Total: {chart.counts.total} stitches
        </div>
      </div>
    );
  };
  
  const zoomButtonStyle = {
    width: '30px',
    height: '30px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '16px'
  };
  
  if (!pattern || pattern.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
        <h3>No Pattern to Visualize</h3>
        <p style={{ color: '#666' }}>
          Add stitches to your pattern to see visualizations
        </p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px 8px 0 0'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Pattern Visualization</h2>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {pattern.length} stitches · {chart?.metadata?.uniqueStitches || 0} unique types · 
          {' '}{chart?.metadata?.difficulty || 'Unknown'} difficulty
        </div>
      </div>
      
      {/* Controls */}
      <div style={{
        background: 'white',
        padding: '15px',
        borderBottom: '1px solid #ddd'
      }}>
        {renderChartTypeSelector()}
        
        <div style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={showLegend}
              onChange={(e) => setShowLegend(e.target.checked)}
            />
            Show Legend
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={showCounts}
              onChange={(e) => setShowCounts(e.target.checked)}
            />
            Show Counts
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={interactive}
              onChange={(e) => setInteractive(e.target.checked)}
            />
            Interactive
          </label>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
            <button
              onClick={() => handleExport('svg')}
              style={{
                padding: '6px 12px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Export SVG
            </button>
            <button
              onClick={() => handleExport('json')}
              style={{
                padding: '6px 12px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>
      
      {/* Chart Display */}
      <div style={{ padding: '20px', background: '#f5f5f5' }}>
        {chartType === 'written' && renderWrittenChart()}
        {chartType === 'symbol' && renderSymbolChart()}
        {chartType === 'graph' && renderGraphChart()}
        {chartType === 'diagram' && renderDiagram()}
        {chartType === '3d' && render3DVisualization()}
        
        {renderLegend()}
        {renderStitchCounts()}
      </div>
    </div>
  );
}

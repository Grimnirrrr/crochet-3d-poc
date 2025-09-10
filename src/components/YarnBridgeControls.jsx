// src/components/YarnBridgeControls.jsx
// UI controls for yarn bridge visualization

import React from 'react';

export function YarnBridgeControls({
  bridgesVisible,
  yarnColor,
  yarnThickness,
  yarnSag,
  animateCreation,
  bridgeStats,
  onToggleVisible,
  onColorChange,
  onThicknessChange,
  onSagChange,
  onToggleAnimation,
  onClearBridges
}) {
  // Convert hex color to string for input
  const colorString = `#${yarnColor.toString(16).padStart(6, '0')}`;
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      minWidth: '240px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 1000,
      border: '1px solid rgba(251, 191, 36, 0.3)'
    }}>
      <h3 style={{ 
        margin: '0 0 10px 0', 
        fontSize: '14px',
        color: '#fbbf24'
      }}>
        🧶 Yarn Bridges
      </h3>
      
      {/* Visibility Toggle */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          padding: '5px',
          background: bridgesVisible ? '#fbbf24' : '#666',
          borderRadius: '4px',
          textAlign: 'center',
          marginBottom: '5px',
          color: bridgesVisible ? '#000' : '#fff',
          fontWeight: 'bold'
        }}>
          {bridgesVisible ? '👁️ Visible' : '🙈 Hidden'}
        </div>
        <button
          onClick={onToggleVisible}
          style={{
            width: '100%',
            padding: '5px',
            background: 'rgba(251, 191, 36, 0.2)',
            color: '#fbbf24',
            border: '1px solid #fbbf24',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Toggle Visibility
        </button>
      </div>
      
      {/* Yarn Color */}
      <div style={{ 
        marginBottom: '10px',
        opacity: bridgesVisible ? 1 : 0.5,
        pointerEvents: bridgesVisible ? 'auto' : 'none'
      }}>
        <label style={{ fontSize: '11px' }}>
          <div style={{ marginBottom: '3px' }}>
            Yarn Color
          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <input 
              type="color"
              value={colorString}
              onChange={(e) => {
                const hex = parseInt(e.target.value.slice(1), 16);
                onColorChange(hex);
              }}
              style={{ 
                width: '50px',
                height: '25px',
                border: '1px solid #fbbf24',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
            <span style={{ color: '#888', fontSize: '10px' }}>
              {colorString}
            </span>
          </div>
        </label>
      </div>
      
      {/* Yarn Thickness */}
      <div style={{ 
        marginBottom: '10px',
        opacity: bridgesVisible ? 1 : 0.5,
        pointerEvents: bridgesVisible ? 'auto' : 'none'
      }}>
        <label style={{ fontSize: '11px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '3px'
          }}>
            <span>Thickness</span>
            <span style={{ color: '#fbbf24' }}>{yarnThickness.toFixed(2)}</span>
          </div>
          <input 
            type="range"
            min="0.02"
            max="0.15"
            step="0.01"
            value={yarnThickness}
            onChange={(e) => onThicknessChange(parseFloat(e.target.value))}
            style={{ 
              width: '100%',
              accentColor: '#fbbf24'
            }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#666'
          }}>
            <span>Thin</span>
            <span>Thick</span>
          </div>
        </label>
      </div>
      
      {/* Yarn Sag */}
      <div style={{ 
        marginBottom: '10px',
        opacity: bridgesVisible ? 1 : 0.5,
        pointerEvents: bridgesVisible ? 'auto' : 'none'
      }}>
        <label style={{ fontSize: '11px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '3px'
          }}>
            <span>Yarn Sag</span>
            <span style={{ color: '#fbbf24' }}>{yarnSag.toFixed(2)}</span>
          </div>
          <input 
            type="range"
            min="0"
            max="0.3"
            step="0.01"
            value={yarnSag}
            onChange={(e) => onSagChange(parseFloat(e.target.value))}
            style={{ 
              width: '100%',
              accentColor: '#fbbf24'
            }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#666'
          }}>
            <span>Tight</span>
            <span>Loose</span>
          </div>
        </label>
      </div>
      
      {/* Animation Toggle */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          fontSize: '11px'
        }}>
          <input 
            type="checkbox"
            checked={animateCreation}
            onChange={onToggleAnimation}
            style={{ marginRight: '8px' }}
          />
          <span>Animate Creation</span>
        </label>
      </div>
      
      {/* Statistics */}
      <div style={{
        marginBottom: '10px',
        padding: '8px',
        background: 'rgba(251, 191, 36, 0.1)',
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        <div style={{ color: '#fbbf24', marginBottom: '5px' }}>
          Bridge Statistics
        </div>
        <div>Active Bridges: {bridgeStats.activeBridges}</div>
        <div>Total Created: {bridgeStats.totalBridges}</div>
        <div>Total Length: {bridgeStats.totalYarnLength.toFixed(1)}</div>
        {bridgeStats.activeBridges > 0 && (
          <div>Avg Length: {bridgeStats.averageLength.toFixed(2)}</div>
        )}
      </div>
      
      {/* Clear Bridges Button */}
      {bridgeStats.activeBridges > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={onClearBridges}
            style={{
              width: '100%',
              padding: '6px',
              background: 'rgba(239, 68, 68, 0.8)',
              color: 'white',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.target.style.background = '#ef4444'}
            onMouseOut={e => e.target.style.background = 'rgba(239, 68, 68, 0.8)'}
          >
            Clear All Bridges ({bridgeStats.activeBridges})
          </button>
        </div>
      )}
      
      {/* Visual Guide */}
      <div style={{
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        fontSize: '10px',
        marginBottom: '10px'
      }}>
        <div style={{ marginBottom: '3px' }}>
          <span style={{ color: '#fbbf24' }}>━━━</span> Yarn connection
        </div>
        <div style={{ marginBottom: '3px' }}>
          <span style={{ color: '#00ff00' }}>━━━</span> Highlighted
        </div>
        <div>
          <span style={{ color: '#ffff00' }}>⚡</span> Creating animation
        </div>
      </div>
      
      {/* Instructions */}
      <div style={{
        paddingTop: '10px',
        borderTop: '1px solid #333',
        fontSize: '10px',
        color: '#888'
      }}>
        <div>🧶 Shows physical connections</div>
        <div>📏 Updates as pieces move</div>
        <div>✨ Animates new connections</div>
        <div>🎨 Customizable appearance</div>
      </div>
    </div>
  );
}

export default YarnBridgeControls;
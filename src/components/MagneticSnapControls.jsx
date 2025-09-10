// src/components/MagneticSnapControls.jsx
// UI controls for magnetic snap functionality

import React from 'react';

export function MagneticSnapControls({
  snapEnabled,
  snapDistance,
  snapStrength,
  isSnapping,
  snapStats,
  onToggleSnap,
  onSnapDistanceChange,
  onSnapStrengthChange,
  onClearConnections
}) {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      minWidth: '220px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 1000,
      border: '1px solid rgba(0, 255, 255, 0.3)'
    }}>
      <h3 style={{ 
        margin: '0 0 10px 0', 
        fontSize: '14px',
        color: '#00ffff'
      }}>
        🧲 Magnetic Snap
      </h3>
      
      {/* Snap Status */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          padding: '5px',
          background: isSnapping ? '#00ff00' : (snapEnabled ? '#0080ff' : '#666'),
          borderRadius: '4px',
          textAlign: 'center',
          marginBottom: '5px',
          transition: 'all 0.3s'
        }}>
          {isSnapping ? '⚡ Snapping!' : (snapEnabled ? '✓ Active' : '✗ Disabled')}
        </div>
      </div>
      
      {/* Enable/Disable Toggle */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer' 
        }}>
          <input 
            type="checkbox"
            checked={snapEnabled}
            onChange={onToggleSnap}
            style={{ marginRight: '8px' }}
          />
          <span>Enable Magnetic Snap</span>
        </label>
      </div>
      
      {/* Snap Distance Control */}
      <div style={{ 
        marginBottom: '10px',
        opacity: snapEnabled ? 1 : 0.5,
        pointerEvents: snapEnabled ? 'auto' : 'none'
      }}>
        <label style={{ fontSize: '11px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '3px'
          }}>
            <span>Snap Distance</span>
            <span style={{ color: '#00ff00' }}>{snapDistance.toFixed(1)}</span>
          </div>
          <input 
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={snapDistance}
            onChange={(e) => onSnapDistanceChange(parseFloat(e.target.value))}
            style={{ 
              width: '100%',
              accentColor: '#00ffff'
            }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#666',
            marginTop: '2px'
          }}>
            <span>Close</span>
            <span>Far</span>
          </div>
        </label>
      </div>
      
      {/* Snap Strength Control */}
      <div style={{ 
        marginBottom: '10px',
        opacity: snapEnabled ? 1 : 0.5,
        pointerEvents: snapEnabled ? 'auto' : 'none'
      }}>
        <label style={{ fontSize: '11px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '3px'
          }}>
            <span>Magnetic Strength</span>
            <span style={{ color: '#00ff00' }}>{(snapStrength * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={snapStrength}
            onChange={(e) => onSnapStrengthChange(parseFloat(e.target.value))}
            style={{ 
              width: '100%',
              accentColor: '#00ffff'
            }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#666',
            marginTop: '2px'
          }}>
            <span>Weak</span>
            <span>Strong</span>
          </div>
        </label>
      </div>
      
      {/* Visual Indicators */}
      <div style={{
        marginBottom: '10px',
        padding: '8px',
        background: 'rgba(0, 255, 255, 0.1)',
        borderRadius: '4px',
        fontSize: '11px'
      }}>
        <div style={{ marginBottom: '3px' }}>
          <span style={{ color: '#00ff00' }}>●</span> Available points
        </div>
        <div style={{ marginBottom: '3px' }}>
          <span style={{ color: '#ffff00' }}>●</span> Magnetic field active
        </div>
        <div>
          <span style={{ color: '#00ffff' }}>●</span> Compatible connection
        </div>
      </div>
      
      {/* Statistics */}
      <div style={{
        marginBottom: '10px',
        padding: '8px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        <div style={{ color: '#888', marginBottom: '5px' }}>Statistics</div>
        <div>Pieces: {snapStats.registeredPieces}</div>
        <div>Connections: {snapStats.activeConnections}</div>
        <div>Total Snaps: {snapStats.snapHistory}</div>
        {snapStats.lastSnap && (
          <div style={{ 
            marginTop: '3px',
            fontSize: '9px',
            color: '#00ff00'
          }}>
            Last: {snapStats.lastSnap.movingPoint?.id} → {snapStats.lastSnap.targetPoint?.id}
          </div>
        )}
      </div>
      
      {/* Clear Connections Button */}
      {snapStats.activeConnections > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={onClearConnections}
            style={{
              width: '100%',
              padding: '6px',
              background: 'rgba(255, 69, 0, 0.8)',
              color: 'white',
              border: '1px solid #ff4500',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.target.style.background = '#ff4500'}
            onMouseOut={e => e.target.style.background = 'rgba(255, 69, 0, 0.8)'}
          >
            Clear All Connections
          </button>
        </div>
      )}
      
      {/* Instructions */}
      <div style={{
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #333',
        fontSize: '10px',
        color: '#888'
      }}>
        <div>🎯 Drag pieces near each other</div>
        <div>⚡ Auto-snaps when close</div>
        <div>🔗 Compatible points connect</div>
        <div>✨ Visual feedback shows targets</div>
      </div>
    </div>
  );
}

export default MagneticSnapControls;

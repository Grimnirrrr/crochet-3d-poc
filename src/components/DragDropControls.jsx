// src/components/DragDropControls.jsx
// UI controls for drag & drop functionality

import React from 'react';

export function DragDropControls({ 
  isDragging,
  draggedPiece,
  snapToGrid,
  gridSize,
  dragStats,
  onToggleSnap,
  onGridSizeChange,
  onToggleYLock,
  onResetPositions
}) {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      minWidth: '200px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
        🎯 Drag & Drop Controls
      </h3>
      
      {/* Drag Status */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          padding: '5px',
          background: isDragging ? '#4CAF50' : '#333',
          borderRadius: '4px',
          textAlign: 'center',
          marginBottom: '5px'
        }}>
          {isDragging ? '✋ Dragging...' : '✓ Ready'}
        </div>
        {draggedPiece && (
          <div style={{ fontSize: '11px', color: '#88ff88' }}>
            Moving: {draggedPiece.name || draggedPiece.id}
          </div>
        )}
      </div>
      
      {/* Grid Snapping */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input 
            type="checkbox"
            checked={snapToGrid}
            onChange={onToggleSnap}
            style={{ marginRight: '8px' }}
          />
          <span>Snap to Grid</span>
        </label>
        
        {snapToGrid && (
          <div style={{ marginTop: '5px', marginLeft: '20px' }}>
            <label style={{ fontSize: '11px' }}>
              Grid Size: {gridSize.toFixed(1)}
              <input 
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={gridSize}
                onChange={(e) => onGridSizeChange(parseFloat(e.target.value))}
                style={{ 
                  width: '100%',
                  marginTop: '3px'
                }}
              />
            </label>
          </div>
        )}
      </div>
      
      {/* Movement Options */}
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={onToggleYLock}
          style={{
            width: '100%',
            padding: '5px',
            background: '#444',
            color: 'white',
            border: '1px solid #666',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
          onMouseOver={e => e.target.style.background = '#555'}
          onMouseOut={e => e.target.style.background = '#444'}
        >
          🔒 Toggle Y-Axis Lock
        </button>
      </div>
      
      {/* Reset Button */}
      {onResetPositions && (
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={onResetPositions}
            style={{
              width: '100%',
              padding: '5px',
              background: '#8B4513',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
            onMouseOver={e => e.target.style.background = '#A0522D'}
            onMouseOut={e => e.target.style.background = '#8B4513'}
          >
            ↺ Reset All Positions
          </button>
        </div>
      )}
      
      {/* Stats */}
      <div style={{
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #555',
        fontSize: '10px',
        color: '#888'
      }}>
        <div>Total Drags: {dragStats.totalDrags}</div>
        {dragStats.lastDragTime && (
          <div>
            Last: {new Date(dragStats.lastDragTime).toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div style={{
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #555',
        fontSize: '10px',
        color: '#666'
      }}>
        <div>🖱️ Left-click & drag to move</div>
        <div>📱 Touch & drag on mobile</div>
        <div>🎯 Hover to highlight pieces</div>
      </div>
    </div>
  );
}

export default DragDropControls;

// src/components/UndoRedoControls.jsx
// UI controls for undo/redo functionality

import React, { useState } from 'react';

export function UndoRedoControls({
  canUndo,
  canRedo,
  history = [],
  currentAction,
  onUndo,
  onRedo,
  onJumpTo,
  onClear,
  stats = {}
}) {
  const [showHistory, setShowHistory] = useState(false);
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  // Get action icon
  const getActionIcon = (type) => {
    const icons = {
      'add_piece': '➕',
      'remove_piece': '➖',
      'move_piece': '↔️',
      'connect': '🔗',
      'disconnect': '✂️',
      'modify_piece': '✏️',
      'batch': '📦'
    };
    return icons[type] || '📝';
  };
  
  return (
    <div style={{
      position: 'absolute',
      top: '60px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      minWidth: '200px',
      maxWidth: '280px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 997,
      border: '1px solid #4a5568'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid #4a5568'
      }}>
        <h3 style={{ 
          margin: 0,
          fontSize: '13px',
          color: '#cbd5e0'
        }}>
          ↩️ History
        </h3>
        {stats.historySize > 0 && (
          <span style={{
            fontSize: '10px',
            color: '#718096'
          }}>
            {stats.currentPosition || 0}/{stats.historySize || 0}
          </span>
        )}
      </div>
      
      {/* Undo/Redo Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            flex: 1,
            padding: '8px',
            background: canUndo ? '#2d3748' : '#1a202c',
            color: canUndo ? '#cbd5e0' : '#4a5568',
            border: '1px solid #4a5568',
            borderRadius: '4px',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => canUndo && (e.target.style.background = '#4a5568')}
          onMouseOut={e => canUndo && (e.target.style.background = '#2d3748')}
          title="Ctrl+Z"
        >
          ↶ Undo
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          style={{
            flex: 1,
            padding: '8px',
            background: canRedo ? '#2d3748' : '#1a202c',
            color: canRedo ? '#cbd5e0' : '#4a5568',
            border: '1px solid #4a5568',
            borderRadius: '4px',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => canRedo && (e.target.style.background = '#4a5568')}
          onMouseOut={e => canRedo && (e.target.style.background = '#2d3748')}
          title="Ctrl+Shift+Z"
        >
          ↷ Redo
        </button>
      </div>
      
      {/* Current Action Display */}
      {currentAction && (
        <div style={{
          padding: '8px',
          background: 'rgba(66, 153, 225, 0.1)',
          borderRadius: '4px',
          marginBottom: '12px',
          border: '1px solid #4299e1',
          fontSize: '11px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px'
          }}>
            <span>{getActionIcon(currentAction.type)}</span>
            <span style={{ color: '#90cdf4' }}>Current</span>
          </div>
          <div style={{ 
            color: '#cbd5e0',
            fontSize: '10px'
          }}>
            {currentAction.description}
          </div>
        </div>
      )}
      
      {/* History Toggle */}
      <div 
        onClick={() => setShowHistory(!showHistory)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px',
          background: '#2d3748',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: showHistory ? '8px' : 0,
          fontSize: '11px',
          transition: 'all 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = '#4a5568'}
        onMouseOut={e => e.currentTarget.style.background = '#2d3748'}
      >
        <span>Action History</span>
        <span>{showHistory ? '▼' : '▶'}</span>
      </div>
      
      {/* History List */}
      {showHistory && (
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          marginBottom: '12px',
          border: '1px solid #2d3748',
          borderRadius: '4px',
          padding: '4px'
        }}>
          {history.length > 0 ? (
            history.map((action, index) => (
              <div
                key={action.id}
                onClick={() => onJumpTo && onJumpTo(index)}
                style={{
                  padding: '6px',
                  marginBottom: '4px',
                  background: action.isCurrent 
                    ? 'rgba(66, 153, 225, 0.2)' 
                    : action.relativeIndex > 0
                    ? 'rgba(72, 187, 120, 0.1)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '3px',
                  cursor: action.canJumpTo ? 'pointer' : 'default',
                  fontSize: '10px',
                  border: action.isCurrent 
                    ? '1px solid #4299e1' 
                    : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => !action.isCurrent && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                onMouseOut={e => !action.isCurrent && (e.currentTarget.style.background = action.relativeIndex > 0 ? 'rgba(72, 187, 120, 0.1)' : 'rgba(255, 255, 255, 0.05)')}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{getActionIcon(action.type)}</span>
                  <span style={{ 
                    color: action.isCurrent ? '#90cdf4' : '#cbd5e0'
                  }}>
                    {action.description}
                  </span>
                </div>
                <div style={{
                  fontSize: '9px',
                  color: '#718096',
                  marginTop: '2px'
                }}>
                  {formatTime(action.timestamp)}
                  {action.relativeIndex !== 0 && (
                    <span style={{ marginLeft: '8px' }}>
                      {action.relativeIndex > 0 ? '+' : ''}{action.relativeIndex}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: '12px',
              textAlign: 'center',
              color: '#718096',
              fontSize: '10px'
            }}>
              No actions yet
            </div>
          )}
        </div>
      )}
      
      {/* Statistics */}
      {stats && stats.totalActions > 0 && (
        <div style={{
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          fontSize: '10px',
          marginBottom: '12px'
        }}>
          <div style={{ color: '#718096', marginBottom: '4px' }}>
            Statistics
          </div>
          <div style={{ display: 'grid', gap: '2px' }}>
            <div>Total actions: {stats.totalActions || 0}</div>
            <div>Undos: {stats.undoCount || 0}</div>
            <div>Redos: {stats.redoCount || 0}</div>
          </div>
        </div>
      )}
      
      {/* Clear History Button */}
      {history.length > 0 && (
        <button
          onClick={onClear}
          style={{
            width: '100%',
            padding: '6px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fc8181',
            border: '1px solid #fc8181',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
          onMouseOut={e => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
        >
          Clear History
        </button>
      )}
      
      {/* Keyboard Shortcuts */}
      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #2d3748',
        fontSize: '9px',
        color: '#718096'
      }}>
        <div>Ctrl+Z: Undo</div>
        <div>Ctrl+Shift+Z: Redo</div>
        <div>Click history to jump</div>
      </div>
    </div>
  );
}

export default UndoRedoControls;

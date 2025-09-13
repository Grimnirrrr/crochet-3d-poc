// src/components/MultiSelectUI.jsx
// Visual multi-select interface component

import React, { useState, useEffect } from 'react';

export function MultiSelectUI({
  selectedCount = 0,
  availableActions = [],
  selectionMode = 'single',
  onActionExecute,
  onSelectionModeChange,
  onSelectAll,
  onClearSelection,
  onInvertSelection,
  onCopy,
  onCut,
  onPaste,
  clipboard = null
}) {
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [actionParams, setActionParams] = useState({});
  
  const modeIcons = {
    single: '👆',
    multiple: '✋',
    box: '⬚',
    lasso: '✏️'
  };
  
  const handleActionClick = (action) => {
    if (!action.enabled) return;
    
    if (requiresParams(action.key)) {
      setActiveAction(action);
      setActionParams(getDefaultParams(action.key));
    } else {
      onActionExecute?.(action.key, {});
      setActiveAction(null);
    }
  };
  
  const requiresParams = (actionKey) => {
    const paramsRequired = ['move', 'rotate', 'scale', 'align', 'distribute', 'mirror', 'changeColor', 'changePattern'];
    return paramsRequired.includes(actionKey);
  };
  
  const getDefaultParams = (actionKey) => {
    switch (actionKey) {
      case 'move':
        return { x: 0, y: 0, z: 0 };
      case 'rotate':
        return { angle: 90, axis: 'y' };
      case 'scale':
        return { scale: 1.5, uniform: true };
      case 'align':
        return { alignment: 'center', axis: 'x' };
      case 'distribute':
        return { axis: 'x', spacing: 'equal' };
      case 'mirror':
        return { axis: 'x', center: 0 };
      case 'changeColor':
        return { color: '#FF6B6B' };
      case 'changePattern':
        return { pattern: ['sc', 'dc', 'inc'] };
      default:
        return {};
    }
  };
  
  const executeWithParams = () => {
    if (activeAction) {
      onActionExecute?.(activeAction.key, actionParams);
      setActiveAction(null);
      setActionParams({});
    }
  };
  
  useEffect(() => {
    setShowActionPanel(selectedCount > 0);
  }, [selectedCount]);
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Selection Mode Switcher */}
      <div style={{
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          gap: '5px',
          marginBottom: '8px'
        }}>
          {Object.entries(modeIcons).map(([mode, icon]) => (
            <button
              key={mode}
              onClick={() => onSelectionModeChange?.(mode)}
              style={{
                width: '36px',
                height: '36px',
                border: selectionMode === mode ? '2px solid #2196F3' : '1px solid #ddd',
                borderRadius: '4px',
                background: selectionMode === mode ? '#E3F2FD' : 'white',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={mode.charAt(0).toUpperCase() + mode.slice(1) + ' selection'}
            >
              {icon}
            </button>
          ))}
        </div>
        
        {/* Selection Info */}
        <div style={{
          padding: '8px',
          background: selectedCount > 0 ? '#4CAF50' : '#f5f5f5',
          color: selectedCount > 0 ? 'white' : '#666',
          borderRadius: '4px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          {selectedCount} selected
        </div>
        
        {/* Selection Controls */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '8px'
        }}>
          <button
            onClick={onSelectAll}
            style={{
              flex: 1,
              padding: '4px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            title="Select All (Ctrl+A)"
          >
            All
          </button>
          <button
            onClick={onClearSelection}
            style={{
              flex: 1,
              padding: '4px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            title="Clear Selection (Esc)"
          >
            None
          </button>
          <button
            onClick={onInvertSelection}
            style={{
              flex: 1,
              padding: '4px',
              background: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            title="Invert Selection (Ctrl+I)"
          >
            Invert
          </button>
        </div>
      </div>
      
      {/* Action Panel */}
      {showActionPanel && (
        <div style={{
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Actions</h4>
          
          {/* Clipboard Actions */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid #eee'
          }}>
            <button
              onClick={onCopy}
              style={{
                flex: 1,
                padding: '6px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Copy (Ctrl+C)"
            >
              📋 Copy
            </button>
            <button
              onClick={onCut}
              style={{
                flex: 1,
                padding: '6px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Cut (Ctrl+X)"
            >
              ✂️ Cut
            </button>
            <button
              onClick={onPaste}
              disabled={!clipboard}
              style={{
                flex: 1,
                padding: '6px',
                background: clipboard ? '#2196F3' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                fontSize: '12px',
                cursor: clipboard ? 'pointer' : 'not-allowed'
              }}
              title="Paste (Ctrl+V)"
            >
              📄 Paste
            </button>
          </div>
          
          {/* Batch Actions Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px'
          }}>
            {availableActions.map(action => (
              <button
                key={action.key}
                onClick={() => handleActionClick(action)}
                disabled={!action.enabled}
                style={{
                  padding: '8px 4px',
                  background: action.enabled ? 'white' : '#f5f5f5',
                  border: action.enabled ? '1px solid #ddd' : '1px solid #eee',
                  borderRadius: '4px',
                  cursor: action.enabled ? 'pointer' : 'not-allowed',
                  opacity: action.enabled ? 1 : 0.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '11px',
                  transition: 'all 0.2s'
                }}
                title={`${action.name} (${action.hotkey})`}
                onMouseEnter={(e) => {
                  if (action.enabled) {
                    e.currentTarget.style.background = '#E3F2FD';
                    e.currentTarget.style.borderColor = '#2196F3';
                  }
                }}
                onMouseLeave={(e) => {
                  if (action.enabled) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#ddd';
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>{action.icon}</span>
                <span>{action.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Parameter Dialog */}
      {activeAction && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          border: '2px solid #2196F3',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 1001,
          minWidth: '300px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
            {activeAction.icon} {activeAction.name} Parameters
          </h3>
          
          <div style={{ marginBottom: '12px' }}>
            {activeAction.key === 'move' && (
              <>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  X: <input
                    type="number"
                    value={actionParams.x}
                    onChange={(e) => setActionParams({...actionParams, x: parseFloat(e.target.value)})}
                    style={{ width: '60px', marginLeft: '8px' }}
                  />
                </label>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  Y: <input
                    type="number"
                    value={actionParams.y}
                    onChange={(e) => setActionParams({...actionParams, y: parseFloat(e.target.value)})}
                    style={{ width: '60px', marginLeft: '8px' }}
                  />
                </label>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  Z: <input
                    type="number"
                    value={actionParams.z}
                    onChange={(e) => setActionParams({...actionParams, z: parseFloat(e.target.value)})}
                    style={{ width: '60px', marginLeft: '8px' }}
                  />
                </label>
              </>
            )}
            
            {activeAction.key === 'rotate' && (
              <>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  Angle: <input
                    type="number"
                    value={actionParams.angle}
                    onChange={(e) => setActionParams({...actionParams, angle: parseFloat(e.target.value)})}
                    style={{ width: '60px', marginLeft: '8px' }}
                  /> degrees
                </label>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  Axis: 
                  <select
                    value={actionParams.axis}
                    onChange={(e) => setActionParams({...actionParams, axis: e.target.value})}
                    style={{ marginLeft: '8px' }}
                  >
                    <option value="x">X</option>
                    <option value="y">Y</option>
                    <option value="z">Z</option>
                  </select>
                </label>
              </>
            )}
            
            {activeAction.key === 'scale' && (
              <>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={actionParams.uniform}
                    onChange={(e) => setActionParams({...actionParams, uniform: e.target.checked})}
                  /> Uniform scale
                </label>
                {actionParams.uniform ? (
                  <label style={{ display: 'block', marginBottom: '8px' }}>
                    Scale: <input
                      type="number"
                      value={actionParams.scale}
                      onChange={(e) => setActionParams({...actionParams, scale: parseFloat(e.target.value)})}
                      step="0.1"
                      style={{ width: '60px', marginLeft: '8px' }}
                    />
                  </label>
                ) : (
                  <>
                    <label style={{ display: 'block', marginBottom: '8px' }}>
                      X: <input
                        type="number"
                        value={actionParams.scaleX || 1}
                        onChange={(e) => setActionParams({...actionParams, scaleX: parseFloat(e.target.value)})}
                        step="0.1"
                        style={{ width: '60px', marginLeft: '8px' }}
                      />
                    </label>
                    <label style={{ display: 'block', marginBottom: '8px' }}>
                      Y: <input
                        type="number"
                        value={actionParams.scaleY || 1}
                        onChange={(e) => setActionParams({...actionParams, scaleY: parseFloat(e.target.value)})}
                        step="0.1"
                        style={{ width: '60px', marginLeft: '8px' }}
                      />
                    </label>
                    <label style={{ display: 'block', marginBottom: '8px' }}>
                      Z: <input
                        type="number"
                        value={actionParams.scaleZ || 1}
                        onChange={(e) => setActionParams({...actionParams, scaleZ: parseFloat(e.target.value)})}
                        step="0.1"
                        style={{ width: '60px', marginLeft: '8px' }}
                      />
                    </label>
                  </>
                )}
              </>
            )}
            
            {activeAction.key === 'align' && (
              <>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  Alignment:
                  <select
                    value={actionParams.alignment}
                    onChange={(e) => setActionParams({...actionParams, alignment: e.target.value})}
                    style={{ marginLeft: '8px' }}
                  >
                    <option value="min">Min</option>
                    <option value="center">Center</option>
                    <option value="max">Max</option>
                  </select>
                </label>
                <label style={{ display: 'block', marginBottom: '8px' }}>
                  Axis:
                  <select
                    value={actionParams.axis}
                    onChange={(e) => setActionParams({...actionParams, axis: e.target.value})}
                    style={{ marginLeft: '8px' }}
                  >
                    <option value="x">X</option>
                    <option value="y">Y</option>
                    <option value="z">Z</option>
                  </select>
                </label>
              </>
            )}
            
            {activeAction.key === 'changeColor' && (
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Color: <input
                  type="color"
                  value={actionParams.color}
                  onChange={(e) => setActionParams({...actionParams, color: e.target.value})}
                  style={{ marginLeft: '8px' }}
                />
              </label>
            )}
            
            {activeAction.key === 'changePattern' && (
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Pattern: <input
                  type="text"
                  value={actionParams.pattern?.join(', ') || ''}
                  onChange={(e) => setActionParams({...actionParams, pattern: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="sc, dc, inc"
                  style={{ marginLeft: '8px', width: '150px' }}
                />
              </label>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setActiveAction(null);
                setActionParams({});
              }}
              style={{
                padding: '6px 12px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={executeWithParams}
              style={{
                padding: '6px 12px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

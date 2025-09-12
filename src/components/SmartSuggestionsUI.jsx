// src/components/SmartSuggestionsUI.jsx
// Visual suggestions display component

import React, { useState, useEffect } from 'react';

export function SmartSuggestionsUI({
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
  onRefresh,
  onFilterChange,
  assemblyInfo = {}
}) {
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'piece': return '🧩';
      case 'connection': return '🔗';
      case 'pattern': return '🧶';
      case 'structural': return '🏗️';
      case 'optimization': return '⚡';
      default: return '💡';
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA500';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };
  
  const getConfidenceBar = (confidence) => {
    const percentage = Math.round(confidence * 100);
    const color = confidence > 0.7 ? '#4CAF50' : confidence > 0.4 ? '#FFA500' : '#FF6B6B';
    
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px'
      }}>
        <span>Confidence:</span>
        <div style={{
          flex: 1,
          height: '4px',
          background: '#e0e0e0',
          borderRadius: '2px',
          overflow: 'hidden',
          maxWidth: '60px'
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: color
          }} />
        </div>
        <span style={{ color }}>{percentage}%</span>
      </div>
    );
  };
  
  const filteredSuggestions = suggestions.filter(s => {
    if (dismissedSuggestions.has(s.id)) return false;
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterPriority !== 'all' && s.priority !== filterPriority) return false;
    if (showOnlyNew && s.timestamp < Date.now() - 60000) return false; // New = last minute
    return true;
  });
  
  const handleApply = (suggestion) => {
    onApplySuggestion?.(suggestion);
    setDismissedSuggestions(prev => new Set([...prev, suggestion.id]));
  };
  
  const handleDismiss = (suggestion) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestion.id]));
    onDismissSuggestion?.(suggestion);
  };
  
  useEffect(() => {
    onFilterChange?.({ type: filterType, priority: filterPriority, showOnlyNew });
  }, [filterType, filterPriority, showOnlyNew]);
  
  if (suggestions.length === 0) {
    return (
      <div style={{
        padding: '20px',
        background: '#f5f5f5',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>💡</div>
        <p>No suggestions available</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Generate Suggestions
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      background: 'white'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>💡</span>
          <span style={{ fontWeight: 'bold' }}>Smart Suggestions</span>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px'
          }}>
            {filteredSuggestions.length} available
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Refresh
          </button>
        )}
      </div>
      
      {/* Filters */}
      <div style={{
        padding: '10px',
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            background: 'white'
          }}
        >
          <option value="all">All Types</option>
          <option value="piece">Pieces</option>
          <option value="connection">Connections</option>
          <option value="pattern">Patterns</option>
          <option value="structural">Structural</option>
          <option value="optimization">Optimization</option>
        </select>
        
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            background: 'white'
          }}
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
        
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '14px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={showOnlyNew}
            onChange={(e) => setShowOnlyNew(e.target.checked)}
          />
          New only
        </label>
        
        {dismissedSuggestions.size > 0 && (
          <button
            onClick={() => setDismissedSuggestions(new Set())}
            style={{
              marginLeft: 'auto',
              padding: '5px 10px',
              background: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Show {dismissedSuggestions.size} dismissed
          </button>
        )}
      </div>
      
      {/* Suggestions List */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {filteredSuggestions.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666'
          }}>
            No suggestions match the current filters
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              style={{
                borderBottom: '1px solid #eee',
                padding: '12px',
                background: expandedSuggestion === suggestion.id ? '#f9f9f9' : 'white',
                transition: 'background 0.2s'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                {/* Icon and Priority */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '24px' }}>
                    {getTypeIcon(suggestion.type)}
                  </span>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getPriorityColor(suggestion.priority)
                  }} />
                </div>
                
                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '4px'
                  }}>
                    <div>
                      <span style={{
                        fontWeight: 'bold',
                        marginRight: '8px'
                      }}>
                        {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} Suggestion
                      </span>
                      <span style={{
                        background: getPriorityColor(suggestion.priority),
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '11px'
                      }}>
                        {suggestion.priority}
                      </span>
                    </div>
                    {getConfidenceBar(suggestion.confidence)}
                  </div>
                  
                  <p style={{
                    margin: '8px 0',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    {suggestion.reason}
                  </p>
                  
                  {/* Expandable Details */}
                  {expandedSuggestion === suggestion.id && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px',
                      background: '#fff',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0'
                    }}>
                      {suggestion.type === 'piece' && suggestion.piece && (
                        <div>
                          <strong>Suggested Piece:</strong>
                          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                            <li>Type: {suggestion.piece.type}</li>
                            {suggestion.piece.size && <li>Size: {suggestion.piece.size}</li>}
                            {suggestion.piece.pattern && <li>Pattern: {suggestion.piece.pattern.join(', ')}</li>}
                          </ul>
                        </div>
                      )}
                      
                      {suggestion.type === 'connection' && suggestion.from && (
                        <div>
                          <strong>Connection Details:</strong>
                          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                            <li>From: Piece {suggestion.from.piece} - Point {suggestion.from.point}</li>
                            <li>To: Piece {suggestion.to.piece} - Point {suggestion.to.point}</li>
                            {suggestion.distance && <li>Distance: {suggestion.distance.toFixed(2)}</li>}
                          </ul>
                        </div>
                      )}
                      
                      {suggestion.type === 'pattern' && (
                        <div>
                          <strong>Pattern Modification:</strong>
                          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                            <li>Action: {suggestion.modification}</li>
                            {suggestion.recommendedPattern && (
                              <li>Recommended: {suggestion.recommendedPattern.join(', ')}</li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {suggestion.patternContext && (
                        <div style={{ marginTop: '8px' }}>
                          <em>Pattern detected: {suggestion.patternContext}</em>
                        </div>
                      )}
                      
                      {suggestion.learned && (
                        <div style={{
                          marginTop: '8px',
                          padding: '4px 8px',
                          background: '#E3F2FD',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#1976D2'
                        }}>
                          🤖 Learned from your patterns
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '10px'
                  }}>
                    <button
                      onClick={() => setExpandedSuggestion(
                        expandedSuggestion === suggestion.id ? null : suggestion.id
                      )}
                      style={{
                        padding: '4px 12px',
                        background: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {expandedSuggestion === suggestion.id ? 'Less' : 'More'} Details
                    </button>
                    
                    {onApplySuggestion && (
                      <button
                        onClick={() => handleApply(suggestion)}
                        style={{
                          padding: '4px 12px',
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        ✓ Apply
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDismiss(suggestion)}
                      style={{
                        padding: '4px 12px',
                        background: '#fff',
                        color: '#666',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      ✗ Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Summary Footer */}
      {filteredSuggestions.length > 0 && (
        <div style={{
          padding: '10px',
          background: '#f5f5f5',
          borderTop: '1px solid #ddd',
          fontSize: '12px',
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>
            {assemblyInfo.pieceCount && `Assembly: ${assemblyInfo.pieceCount} pieces`}
          </span>
          <span>
            High: {filteredSuggestions.filter(s => s.priority === 'high').length} |
            Medium: {filteredSuggestions.filter(s => s.priority === 'medium').length} |
            Low: {filteredSuggestions.filter(s => s.priority === 'low').length}
          </span>
        </div>
      )}
    </div>
  );
}

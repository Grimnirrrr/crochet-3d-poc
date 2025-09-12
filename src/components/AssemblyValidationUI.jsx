// src/components/AssemblyValidationUI.jsx
// Visual validation feedback component

import React, { useState, useEffect } from 'react';

export function AssemblyValidationUI({ 
  validation = null,
  onRevalidate,
  onRuleToggle,
  onExportReport,
  tier = 'freemium'
}) {
  const [expanded, setExpanded] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');
  
  if (!validation) {
    return (
      <div style={{
        padding: '10px',
        background: '#f5f5f5',
        borderRadius: '8px',
        marginBottom: '10px'
      }}>
        <p style={{ margin: 0, color: '#666' }}>No validation data available</p>
        {onRevalidate && (
          <button 
            onClick={onRevalidate}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Run Validation
          </button>
        )}
      </div>
    );
  }
  
  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFA500';
    if (score >= 40) return '#FF6B6B';
    return '#FF0000';
  };
  
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return '#FF0000';
      case 'warning': return '#FFA500';
      case 'info': return '#2196F3';
      default: return '#666';
    }
  };
  
  const filteredIssues = () => {
    const allIssues = [
      ...validation.errors,
      ...validation.warnings,
      ...validation.info
    ];
    
    if (filterSeverity === 'all') return allIssues;
    return allIssues.filter(issue => issue.severity === filterSeverity);
  };
  
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '10px',
      background: 'white'
    }}>
      {/* Header */}
      <div style={{
        background: validation.valid ? '#4CAF50' : '#FF6B6B',
        color: 'white',
        padding: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer'
      }}
      onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>
            {validation.valid ? '✓' : '✗'}
          </span>
          <span style={{ fontWeight: 'bold' }}>
            Assembly Validation
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px'
          }}>
            {tier.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            background: getScoreColor(validation.score),
            padding: '4px 10px',
            borderRadius: '20px',
            fontWeight: 'bold'
          }}>
            Score: {validation.score}
          </div>
          <span>{expanded ? '▼' : '▶'}</span>
        </div>
      </div>
      
      {/* Summary Bar */}
      <div style={{
        background: '#f5f5f5',
        padding: '10px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {validation.summary}
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          {validation.errors.length > 0 && (
            <span style={{ color: '#FF0000' }}>
              {validation.errors.length} errors
            </span>
          )}
          {validation.warnings.length > 0 && (
            <span style={{ color: '#FFA500' }}>
              {validation.warnings.length} warnings
            </span>
          )}
          {validation.info.length > 0 && (
            <span style={{ color: '#2196F3' }}>
              {validation.info.length} info
            </span>
          )}
        </div>
      </div>
      
      {expanded && (
        <div style={{ padding: '15px' }}>
          {/* Controls */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '15px',
            flexWrap: 'wrap'
          }}>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="all">All Issues</option>
              <option value="error">Errors Only</option>
              <option value="warning">Warnings Only</option>
              <option value="info">Info Only</option>
            </select>
            
            <button
              onClick={() => setShowRules(!showRules)}
              style={{
                padding: '5px 10px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showRules ? 'Hide' : 'Show'} Rules
            </button>
            
            {onRevalidate && (
              <button
                onClick={onRevalidate}
                style={{
                  padding: '5px 10px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Revalidate
              </button>
            )}
            
            {onExportReport && (
              <button
                onClick={onExportReport}
                style={{
                  padding: '5px 10px',
                  background: '#9C27B0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Export Report
              </button>
            )}
          </div>
          
          {/* Issues List */}
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            marginBottom: '15px'
          }}>
            {filteredIssues().length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#666'
              }}>
                No issues found
              </div>
            ) : (
              filteredIssues().map((issue, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px',
                    marginBottom: '8px',
                    background: '#f9f9f9',
                    borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
                    borderRadius: '4px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '16px' }}>
                      {getSeverityIcon(issue.severity)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        color: getSeverityColor(issue.severity)
                      }}>
                        {issue.rule}
                      </div>
                      <div style={{ fontSize: '14px', color: '#333' }}>
                        {issue.message}
                      </div>
                      {issue.context && (
                        <div style={{
                          fontSize: '12px',
                          color: '#666',
                          marginTop: '4px',
                          fontFamily: 'monospace',
                          background: '#fff',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          display: 'inline-block'
                        }}>
                          {JSON.stringify(issue.context)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Rules Panel */}
          {showRules && (
            <div style={{
              borderTop: '1px solid #ddd',
              paddingTop: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Validation Rules</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '10px'
              }}>
                {[
                  { name: 'no-self-connection', type: 'connection', severity: 'error' },
                  { name: 'valid-connection-points', type: 'connection', severity: 'error' },
                  { name: 'point-not-occupied', type: 'connection', severity: 'error' },
                  { name: 'compatible-types', type: 'connection', severity: 'warning' },
                  { name: 'max-connections-per-piece', type: 'structural', severity: 'warning' },
                  { name: 'no-floating-pieces', type: 'structural', severity: 'error' },
                  { name: 'no-cycles', type: 'structural', severity: 'info' },
                  { name: 'valid-stitch-sequence', type: 'pattern', severity: 'warning' },
                  { name: 'pattern-symmetry', type: 'pattern', severity: 'info' },
                  { name: 'tier-piece-limit', type: 'tier', severity: 'error' },
                  { name: 'tier-complexity-limit', type: 'tier', severity: 'warning' }
                ].map(rule => (
                  <div
                    key={rule.name}
                    style={{
                      padding: '8px',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      onChange={(e) => onRuleToggle?.(rule.name, e.target.checked)}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 'bold',
                        marginBottom: '2px'
                      }}>
                        {rule.name}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          background: getSeverityColor(rule.severity),
                          color: 'white',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          fontSize: '10px'
                        }}>
                          {rule.severity}
                        </span>
                        <span style={{ color: '#666' }}>
                          {rule.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Validation Score Breakdown */}
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: '#f0f0f0',
            borderRadius: '4px'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Score Breakdown</h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                flex: 1,
                height: '20px',
                background: '#e0e0e0',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${validation.score}%`,
                  height: '100%',
                  background: getScoreColor(validation.score),
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{
                fontWeight: 'bold',
                fontSize: '18px',
                color: getScoreColor(validation.score)
              }}>
                {validation.score}%
              </span>
            </div>
            <div style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#666'
            }}>
              <div>Base Score: 100</div>
              <div>Errors: -{validation.errors.length * 20}</div>
              <div>Warnings: -{validation.warnings.length * 5}</div>
              <div>Info: -{validation.info.length * 1}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

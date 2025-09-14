// src/components/InstructionsUI.jsx
// Visual instructions display component

import React, { useState, useEffect } from 'react';

export function InstructionsUI({
  instructions,
  onGenerateInstructions,
  onExport,
  onPrint,
  assembly
}) {
  const [activeSection, setActiveSection] = useState(0);
  const [difficulty, setDifficulty] = useState('beginner');
  const [includeImages, setIncludeImages] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState('medium');
  
  const fontSizes = {
    small: '12px',
    medium: '14px',
    large: '16px',
    xlarge: '18px'
  };
  
  const handleGenerateInstructions = () => {
    onGenerateInstructions?.({
      type: 'assembly',
      difficulty,
      includeImages,
      language: 'en'
    });
  };
  
  const toggleStep = (stepId) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };
  
  const expandAll = () => {
    const allSteps = new Set();
    instructions?.sections?.forEach((section, sIndex) => {
      if (section.steps) {
        section.steps.forEach((_, stepIndex) => {
          allSteps.add(`${sIndex}-${stepIndex}`);
        });
      }
    });
    setExpandedSteps(allSteps);
  };
  
  const collapseAll = () => {
    setExpandedSteps(new Set());
  };
  
  const filterContent = (content) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const searchInObject = (obj) => {
      if (typeof obj === 'string') {
        return obj.toLowerCase().includes(searchLower);
      }
      if (Array.isArray(obj)) {
        return obj.some(item => searchInObject(item));
      }
      if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).some(value => searchInObject(value));
      }
      return false;
    };
    
    return searchInObject(content);
  };
  
  const renderDifficultyBadge = (level) => {
    const colors = {
      beginner: '#4CAF50',
      intermediate: '#FFA500',
      advanced: '#FF6B6B'
    };
    
    return (
      <span style={{
        background: colors[level] || '#666',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {level}
      </span>
    );
  };
  
  const renderSection = (section, sectionIndex) => {
    if (!filterContent(section)) return null;
    
    return (
      <div key={sectionIndex} style={{
        marginBottom: '20px',
        background: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          padding: '15px',
          background: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          cursor: 'pointer'
        }}
        onClick={() => setActiveSection(activeSection === sectionIndex ? -1 : sectionIndex)}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>
              {section.title}
            </h3>
            <span style={{ fontSize: '12px' }}>
              {activeSection === sectionIndex ? '▼' : '▶'}
            </span>
          </div>
        </div>
        
        {activeSection === sectionIndex && (
          <div style={{ padding: '15px' }}>
            {section.content && renderContent(section.content)}
            {section.steps && renderSteps(section.steps, sectionIndex)}
            {section.tips && renderTips(section.tips)}
            {section.visual && renderVisualPlaceholder(section.visual)}
          </div>
        )}
      </div>
    );
  };
  
  const renderContent = (content) => {
    if (typeof content === 'string') {
      return <p style={{ margin: '0 0 10px 0' }}>{content}</p>;
    }
    
    if (Array.isArray(content)) {
      return (
        <ul style={{ margin: '0 0 10px 0', paddingLeft: '20px' }}>
          {content.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '5px' }}>{item}</li>
          ))}
        </ul>
      );
    }
    
    if (typeof content === 'object') {
      return (
        <div style={{ marginBottom: '10px' }}>
          {Object.entries(content).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <strong style={{ textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </strong>
              {Array.isArray(value) ? (
                <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                  {value.map((item, idx) => (
                    <li key={idx}>{renderListItem(item)}</li>
                  ))}
                </ul>
              ) : (
                <span style={{ marginLeft: '5px' }}>{value}</span>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };
  
  const renderListItem = (item) => {
    if (typeof item === 'object') {
      if (item.type && item.count) {
        return `${item.type}: ${item.count} pieces`;
      }
      if (item.abbreviation && item.name) {
        return (
          <span>
            <strong>{item.abbreviation}</strong> = {item.name}
            {item.difficulty && (
              <span style={{ 
                marginLeft: '10px',
                fontSize: '11px',
                color: '#666'
              }}>
                (Difficulty: {item.difficulty}/3)
              </span>
            )}
          </span>
        );
      }
      if (item.color && item.amount) {
        return `${item.color}: ${item.amount}`;
      }
      if (item.problem && item.solution) {
        return (
          <div>
            <strong>Problem:</strong> {item.problem}<br />
            <strong>Solution:</strong> {item.solution}
          </div>
        );
      }
    }
    return item;
  };
  
  const renderSteps = (steps, sectionIndex) => {
    return (
      <div style={{ marginTop: '15px' }}>
        {steps.map((step, stepIndex) => {
          const stepId = `${sectionIndex}-${stepIndex}`;
          const isExpanded = expandedSteps.has(stepId);
          
          return (
            <div key={stepIndex} style={{
              marginBottom: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  padding: '10px',
                  background: '#f9f9f9',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => toggleStep(stepId)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    background: '#2196F3',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {step.stepNumber || step.round || stepIndex + 1}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>
                    {step.title || step.instruction}
                  </span>
                </div>
                <span>{isExpanded ? '−' : '+'}</span>
              </div>
              
              {isExpanded && (
                <div style={{ padding: '10px' }}>
                  {step.description && (
                    <p style={{ margin: '0 0 10px 0' }}>{step.description}</p>
                  )}
                  
                  {step.pattern && (
                    <div style={{
                      background: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      marginBottom: '10px'
                    }}>
                      {step.pattern.join(', ')}
                    </div>
                  )}
                  
                  {step.details && (
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                      {Object.entries(step.details).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {value}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {step.stitchCount && (
                    <div style={{
                      display: 'inline-block',
                      background: '#E3F2FD',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginBottom: '10px'
                    }}>
                      Stitch count: {step.stitchCount}
                    </div>
                  )}
                  
                  {step.tips && step.tips.length > 0 && (
                    <div style={{
                      background: '#FFF3CD',
                      border: '1px solid #FFE69C',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '13px'
                    }}>
                      💡 {step.tips.join(' ')}
                    </div>
                  )}
                  
                  {step.tip && (
                    <div style={{
                      background: '#FFF3CD',
                      border: '1px solid #FFE69C',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '13px'
                    }}>
                      💡 {step.tip}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderTips = (tips) => {
    return (
      <div style={{
        background: '#E8F5E9',
        border: '1px solid #C8E6C9',
        borderRadius: '6px',
        padding: '10px',
        marginTop: '15px'
      }}>
        <strong>Tips:</strong>
        <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
          {tips.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>
    );
  };
  
  const renderVisualPlaceholder = (visual) => {
    return (
      <div style={{
        border: '2px dashed #ddd',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        marginTop: '15px',
        background: '#f9f9f9'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>
          {visual.type === 'diagram' ? '📊' : 
           visual.type === 'piece' ? '🧩' :
           visual.type === 'connection' ? '🔗' : '📐'}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {visual.description}
        </div>
        {includeImages && (
          <div style={{ 
            fontSize: '11px', 
            color: '#999',
            marginTop: '5px'
          }}>
            Visual guide would appear here
          </div>
        )}
      </div>
    );
  };
  
  if (!instructions) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
        <h3>No Instructions Generated</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Generate step-by-step instructions for your assembly
        </p>
        
        <div style={{
          display: 'inline-block',
          textAlign: 'left',
          marginBottom: '20px'
        }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            Difficulty Level:
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                marginLeft: '10px',
                padding: '5px'
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
            />
            Include visual guides
          </label>
        </div>
        
        <button
          onClick={handleGenerateInstructions}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Generate Instructions
        </button>
      </div>
    );
  }
  
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontSize: fontSizes[fontSize]
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px 8px 0 0',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: '0 0 10px 0' }}>
          {instructions.assemblyName} Instructions
        </h1>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {renderDifficultyBadge(instructions.metadata?.skillLevel || difficulty)}
          <span>📦 {instructions.metadata?.pieceCount || 0} pieces</span>
          <span>⏱️ {instructions.metadata?.estimatedTime || 'Time varies'}</span>
        </div>
      </div>
      
      {/* Controls */}
      <div style={{
        background: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={expandAll}
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
              Expand All
            </button>
            <button
              onClick={collapseAll}
              style={{
                padding: '6px 12px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Collapse All
            </button>
            
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              style={{
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="small">Small Text</option>
              <option value="medium">Medium Text</option>
              <option value="large">Large Text</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {onExport && (
              <button
                onClick={() => onExport('html')}
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
                📥 Export
              </button>
            )}
            {onPrint && (
              <button
                onClick={onPrint}
                style={{
                  padding: '6px 12px',
                  background: '#9C27B0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🖨️ Print
              </button>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div style={{ marginTop: '10px' }}>
          <input
            type="text"
            placeholder="Search instructions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>
      </div>
      
      {/* Sections */}
      <div>
        {instructions.sections?.map((section, idx) => renderSection(section, idx))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';

export function PatternManager({ onPatternLoad, currentPattern }) {
  const [savedPatterns, setSavedPatterns] = useState([]);
  const [patternName, setPatternName] = useState('');
  
  // Load saved patterns from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('crochetPatterns');
    if (stored) {
      try {
        const patterns = JSON.parse(stored);
        setSavedPatterns(patterns);
      } catch (e) {
        console.error('Error loading saved patterns:', e);
      }
    }
  }, []);
  
  // Save pattern to localStorage
  const savePattern = () => {
    if (!currentPattern || currentPattern.length === 0) {
      alert('No pattern to save! Create a pattern first.');
      return;
    }
    
    const name = patternName.trim() || `Pattern ${new Date().toLocaleDateString()}`;
    
    const patternData = {
      id: Date.now(),
      name: name,
      savedDate: new Date().toISOString(),
      rounds: currentPattern.length,
      totalStitches: currentPattern.reduce((sum, r) => sum + r.stitches, 0),
      pattern: currentPattern
    };
    
    const updatedPatterns = [...savedPatterns, patternData];
    setSavedPatterns(updatedPatterns);
    localStorage.setItem('crochetPatterns', JSON.stringify(updatedPatterns));
    
    setPatternName('');
    alert(`Pattern "${name}" saved successfully!`);
  };
  
  // Load a saved pattern
  const loadPattern = (patternData) => {
    if (onPatternLoad) {
      onPatternLoad(patternData.pattern);
    }
  };
  
  // Delete a saved pattern
  const deletePattern = (id) => {
    if (confirm('Are you sure you want to delete this pattern?')) {
      const updatedPatterns = savedPatterns.filter(p => p.id !== id);
      setSavedPatterns(updatedPatterns);
      localStorage.setItem('crochetPatterns', JSON.stringify(updatedPatterns));
    }
  };
  
  // Import JSON file
  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Check if it's a valid pattern export
        if (data.pattern && Array.isArray(data.pattern)) {
          // Load the pattern
          if (onPatternLoad) {
            onPatternLoad(data.pattern);
          }
          alert('Pattern imported successfully!');
        } else {
          alert('Invalid pattern file format');
        }
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error reading file. Please ensure it\'s a valid JSON pattern file.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be imported again
    event.target.value = '';
  };
  
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
        💾 Pattern Library
      </h2>
      
      {/* Save Current Pattern */}
      <div style={{
        marginBottom: '15px',
        padding: '10px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '6px'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <input
            type="text"
            placeholder="Pattern name (optional)"
            value={patternName}
            onChange={(e) => setPatternName(e.target.value)}
            style={{
              flex: 1,
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
          <button
            onClick={savePattern}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            💾 Save
          </button>
        </div>
      </div>
      
      {/* Import JSON */}
      <div style={{
        marginBottom: '15px'
      }}>
        <label
          style={{
            display: 'block',
            padding: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          📂 Import JSON Pattern
          <input
            type="file"
            accept=".json"
            onChange={importJSON}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      
      {/* Saved Patterns List */}
      {savedPatterns.length > 0 && (
        <div>
          <h3 style={{
            fontSize: '14px',
            margin: '15px 0 10px',
            color: '#fbbf24',
            opacity: 0.9
          }}>
            Saved Patterns ({savedPatterns.length})
          </h3>
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {savedPatterns.map((pattern) => (
              <div
                key={pattern.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px',
                  marginBottom: '5px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>{pattern.name}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>
                    {pattern.rounds} rounds • {pattern.totalStitches} stitches
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.5 }}>
                    {new Date(pattern.savedDate).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => loadPattern(pattern)}
                    style={{
                      padding: '4px 8px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deletePattern(pattern.id)}
                    style={{
                      padding: '4px 8px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {savedPatterns.length === 0 && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          opacity: 0.6,
          fontSize: '13px'
        }}>
          No saved patterns yet. Create and save your first pattern!
        </div>
      )}
    </div>
  );
}
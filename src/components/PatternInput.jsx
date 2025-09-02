import React, { useState } from 'react';
import { parsePattern, validatePattern, patternTemplates } from '../lib/simpleParser';

export function PatternInput({ onPatternParsed, isDisabled }) {
  const [text, setText] = useState(patternTemplates.sphere);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [parsedRounds, setParsedRounds] = useState(null);
  
  const handleParse = () => {
    // Clear previous errors
    setErrors([]);
    setWarnings([]);
    
    try {
      // Parse the pattern
      const rounds = parsePattern(text);
      console.log('Parsed rounds:', rounds);
      
      // Validate
      const validation = validatePattern(rounds);
      
      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }
      
      setWarnings(validation.warnings);
      setParsedRounds(rounds);
      
      // Send to parent component
      if (onPatternParsed) {
        onPatternParsed(rounds);
      }
    } catch (error) {
      console.error('Parse error:', error);
      setErrors([`Parse error: ${error.message}`]);
    }
  };
  
  const loadTemplate = (templateName) => {
    setText(patternTemplates[templateName]);
    setErrors([]);
    setWarnings([]);
    setParsedRounds(null);
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
        margin: '0 0 10px 0', 
        color: '#fbbf24' 
      }}>
        📝 Pattern Input (Phase 2)
      </h2>
      
      {/* Template buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '5px', 
        marginBottom: '10px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => loadTemplate('sphere')}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            background: 'rgba(251, 191, 36, 0.2)',
            border: '1px solid #fbbf24',
            borderRadius: '4px',
            color: '#fbbf24',
            cursor: 'pointer'
          }}
        >
          Ball/Sphere
        </button>
        <button
          onClick={() => loadTemplate('cone')}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            background: 'rgba(251, 191, 36, 0.2)',
            border: '1px solid #fbbf24',
            borderRadius: '4px',
            color: '#fbbf24',
            cursor: 'pointer'
          }}
        >
          Cone
        </button>
        <button
          onClick={() => loadTemplate('simple')}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            background: 'rgba(251, 191, 36, 0.2)',
            border: '1px solid #fbbf24',
            borderRadius: '4px',
            color: '#fbbf24',
            cursor: 'pointer'
          }}
        >
          Simple
        </button>
        <button
          onClick={() => loadTemplate('withDecrease')}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            background: 'rgba(251, 191, 36, 0.2)',
            border: '1px solid #fbbf24',
            borderRadius: '4px',
            color: '#fbbf24',
            cursor: 'pointer'
          }}
        >
          With Decrease
        </button>
      </div>
      
      {/* Pattern textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your crochet pattern...
Round 1: 6 sc in magic ring
Round 2: 2 sc in each (12)
Round 3: [sc, inc] x6 (18)"
        style={{
          width: '100%',
          minHeight: '150px',
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          color: 'white',
          fontFamily: '"Courier New", monospace',
          fontSize: '13px',
          resize: 'vertical'
        }}
      />
      
      {/* Parse button */}
      <button
        onClick={handleParse}
        disabled={isDisabled}
        style={{
          marginTop: '10px',
          width: '100%',
          padding: '10px',
          background: isDisabled 
            ? 'rgba(107, 114, 128, 0.5)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: '600',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.5 : 1
        }}
      >
        {isDisabled ? 'Clear current pattern first' : '🔄 Parse & Visualize Pattern'}
      </button>
      
      {/* Errors */}
      {errors.length > 0 && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid #ef4444',
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          <strong>❌ Errors:</strong>
          {errors.map((error, i) => (
            <div key={i}>{error}</div>
          ))}
        </div>
      )}
      
      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: 'rgba(251, 191, 36, 0.2)',
          border: '1px solid #fbbf24',
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          <strong>⚠️ Warnings:</strong>
          {warnings.map((warning, i) => (
            <div key={i}>{warning}</div>
          ))}
        </div>
      )}
      
      {/* Parsed result preview */}
      {parsedRounds && parsedRounds.length > 0 && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid #10b981',
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          <strong>✅ Parsed {parsedRounds.length} rounds:</strong>
          {parsedRounds.map((round, i) => (
            <div key={i} style={{ marginTop: '5px' }}>
              Round {round.round}: {round.stitches} stitches
              {round.hasIncrease && ' (increases)'}
              {round.hasDecrease && ' (decreases)'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';

export function AccessibilityControls() {
    const [fontSize, setFontSize] = useState('normal');
    const [highContrast, setHighContrast] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
  
  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibilityPrefs');
    if (saved) {
      const prefs = JSON.parse(saved);
      setFontSize(prefs.fontSize || 'normal');
      setHighContrast(prefs.highContrast || false);
      setReducedMotion(prefs.reducedMotion || false);
    }
  }, []);
  
  // Save preferences
  const savePreferences = (updates) => {
    const prefs = {
      fontSize,
      highContrast,
      reducedMotion,
      ...updates
    };
    localStorage.setItem('accessibilityPrefs', JSON.stringify(prefs));
    
    // Apply changes to document
    applyAccessibilitySettings(prefs);
  };
  
  const applyAccessibilitySettings = (prefs) => {
    // Font size
    const sizes = {
      'small': '14px',
      'normal': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    document.documentElement.style.setProperty('--base-font-size', sizes[prefs.fontSize]);
    
    // High contrast
    if (prefs.highContrast) {
      document.documentElement.style.filter = 'contrast(1.2)';
    } else {
      document.documentElement.style.filter = 'none';
    }
    
    // Reduced motion
    if (prefs.reducedMotion) {
      document.documentElement.style.setProperty('--animation-speed', '0');
    } else {
      document.documentElement.style.setProperty('--animation-speed', '1');
    }
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
        ♿ Accessibility
      </h2>
      
      {/* Font Size */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px',
          fontSize: '14px'
        }}>
          Text Size:
        </label>
        <select
          value={fontSize}
          onChange={(e) => {
            setFontSize(e.target.value);
            savePreferences({ fontSize: e.target.value });
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px'
          }}
        >
          <option value="small">Small</option>
          <option value="normal">Normal</option>
          <option value="large">Large</option>
          <option value="extra-large">Extra Large</option>
        </select>
      </div>
      
      {/* High Contrast */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => {
              setHighContrast(e.target.checked);
              savePreferences({ highContrast: e.target.checked });
            }}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '14px' }}>High Contrast Mode</span>
        </label>
      </div>
      
      {/* Reduced Motion */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => {
              setReducedMotion(e.target.checked);
              savePreferences({ reducedMotion: e.target.checked });
            }}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '14px' }}>Reduce Animations</span>
        </label>
      </div>
      
      {/* Keyboard Shortcuts Info */}
      <div style={{
        padding: '10px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <strong>⌨️ Keyboard Shortcuts:</strong>
        <ul style={{ margin: '10px 0 0 20px', lineHeight: '1.6' }}>
          <li><kbd>Tab</kbd> - Navigate controls</li>
          <li><kbd>Enter</kbd> - Activate buttons</li>
          <li><kbd>Arrow Keys</kbd> - Adjust values</li>
          <li><kbd>Esc</kbd> - Close dialogs</li>
        </ul>
      </div>
    </div>
  );
}
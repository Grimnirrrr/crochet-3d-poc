import React, { useState, useEffect } from 'react';

export function PerformanceMonitor({ roundCount, stitchCount }) {
  const [performance, setPerformance] = useState({
    fps: 60,
    memory: 0,
    loadTime: 0,
    warnings: []
  });
  
  useEffect(() => {
    // Monitor performance
    const checkPerformance = () => {
      const warnings = [];
      
      // Check stitch count
      if (stitchCount > 500) {
        warnings.push('High stitch count may affect performance');
      }
      
      if (roundCount > 50) {
        warnings.push('Large number of rounds may slow visualization');
      }
      
      // Check memory usage (if available)
      if (performance.memory && performance.memory.usedJSHeapSize) {
        const memoryMB = performance.memory.usedJSHeapSize / 1048576;
        if (memoryMB > 100) {
          warnings.push(`High memory usage: ${memoryMB.toFixed(1)}MB`);
        }
      }
      
      setPerformance(prev => ({
        ...prev,
        warnings
      }));
    };
    
    checkPerformance();
  }, [roundCount, stitchCount]);
  
  // Only show in development or if there are warnings
  if (process.env.NODE_ENV !== 'development' && performance.warnings.length === 0) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '200px',
      zIndex: 999
    }}>
      <div style={{ marginBottom: '5px', color: '#fbbf24' }}>
        ⚡ Performance
      </div>
      
      {performance.warnings.length > 0 && (
        <div>
          {performance.warnings.map((warning, idx) => (
            <div key={idx} style={{
              padding: '5px',
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '4px',
              marginBottom: '5px'
            }}>
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <div style={{ opacity: 0.6 }}>
          Rounds: {roundCount}<br/>
          Stitches: {stitchCount}
        </div>
      )}
    </div>
  );
}

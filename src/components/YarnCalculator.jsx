import React, { useState, useEffect } from 'react';

export function YarnCalculator({ pattern }) {
  const [yarnEstimate, setYarnEstimate] = useState(null);
  const [yarnWeight, setYarnWeight] = useState('worsted'); // Default yarn weight
  
  // Yarn usage estimates per 100 stitches (in meters)
  const yarnUsageRates = {
    'lace': 8,
    'fingering': 10,
    'sport': 12,
    'dk': 15,
    'worsted': 18,
    'bulky': 25,
    'super-bulky': 35
  };
  
  useEffect(() => {
    if (pattern && pattern.length > 0) {
      calculateYarn();
    }
  }, [pattern, yarnWeight]);
  
  const calculateYarn = () => {
    if (!pattern || pattern.length === 0) return;
    
    const totalStitches = pattern.reduce((sum, round) => sum + round.stitches, 0);
    const ratePerHundred = yarnUsageRates[yarnWeight];
    
    // Calculate yarn needed
    const metersNeeded = (totalStitches / 100) * ratePerHundred;
    const yardsNeeded = metersNeeded * 1.09361; // Convert to yards
    const feetNeeded = yardsNeeded * 3;
    
    // Calculate skeins needed (assuming standard skein sizes)
    const skeinSizes = {
      'lace': 400,
      'fingering': 400,
      'sport': 200,
      'dk': 150,
      'worsted': 200,
      'bulky': 150,
      'super-bulky': 100
    };
    
    const metersPerSkein = skeinSizes[yarnWeight];
    const skeinsNeeded = Math.ceil(metersNeeded / metersPerSkein);
    
    setYarnEstimate({
      totalStitches,
      meters: Math.round(metersNeeded),
      yards: Math.round(yardsNeeded),
      feet: Math.round(feetNeeded),
      skeins: skeinsNeeded,
      metersPerSkein
    });
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
        🧶 Yarn Calculator
      </h2>
      
      {/* Yarn Weight Selector */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '5px',
          fontSize: '14px',
          opacity: 0.9
        }}>
          Select Yarn Weight:
        </label>
        <select
          value={yarnWeight}
          onChange={(e) => setYarnWeight(e.target.value)}
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
          <option value="lace">Lace (0)</option>
          <option value="fingering">Fingering (1)</option>
          <option value="sport">Sport (2)</option>
          <option value="dk">DK (3)</option>
          <option value="worsted">Worsted (4)</option>
          <option value="bulky">Bulky (5)</option>
          <option value="super-bulky">Super Bulky (6)</option>
        </select>
      </div>
      
      {/* Yarn Estimate Display */}
      {yarnEstimate && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <div style={{
              padding: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                {yarnEstimate.meters}m
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Meters
              </div>
            </div>
            
            <div style={{
              padding: '10px',
              background: 'rgba(251, 191, 36, 0.2)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>
                {yarnEstimate.yards}yd
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Yards
              </div>
            </div>
          </div>
          
          <div style={{
            padding: '15px',
            background: 'rgba(99, 102, 241, 0.2)',
            borderRadius: '6px',
            marginBottom: '10px'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: '#6366f1' }}>
              {yarnEstimate.skeins} {yarnEstimate.skeins === 1 ? 'Skein' : 'Skeins'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, textAlign: 'center' }}>
              Based on {yarnEstimate.metersPerSkein}m per skein
            </div>
          </div>
          
          <div style={{
            fontSize: '12px',
            opacity: 0.7,
            padding: '10px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px'
          }}>
            <strong>Calculation Details:</strong><br/>
            • Total stitches: {yarnEstimate.totalStitches}<br/>
            • Yarn weight: {yarnWeight}<br/>
            • Usage rate: {yarnUsageRates[yarnWeight]}m per 100 stitches<br/>
            <br/>
            <em>Note: Add 10-15% extra for safety margin</em>
          </div>
        </div>
      )}
      
      {(!pattern || pattern.length === 0) && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          opacity: 0.6,
          fontSize: '13px'
        }}>
          Add rounds to your pattern to calculate yarn requirements
        </div>
      )}
    </div>
  );
}
// src/components/YarnCalculatorUI.jsx
// Visual yarn calculator interface component

import React, { useState, useEffect } from 'react';

export function YarnCalculatorUI({
  pattern = [],
  calculator,
  onExport,
  onGenerateShoppingList
}) {
  const [yarnWeight, setYarnWeight] = useState(4); // Worsted weight default
  const [yarnChoice, setYarnChoice] = useState('generic-acrylic');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [includeWaste, setIncludeWaste] = useState(true);
  const [includeTax, setIncludeTax] = useState(true);
  const [includeTools, setIncludeTools] = useState(true);
  
  const [calculations, setCalculations] = useState(null);
  const [activeTab, setActiveTab] = useState('requirements');
  const [showComparison, setShowComparison] = useState(false);
  
  useEffect(() => {
    if (pattern.length > 0 && calculator) {
      calculateAll();
    }
  }, [pattern, yarnWeight, yarnChoice, skillLevel, includeWaste, includeTax, includeTools]);
  
  const calculateAll = () => {
    if (!calculator || pattern.length === 0) return;
    
    // Calculate yarn requirements
    const yarnRequirement = calculator.calculateYarnRequirement(pattern, {
      yarnWeight,
      addWaste: includeWaste,
      wasteFactor: 0.1
    });
    
    // Calculate cost
    const cost = calculator.calculateProjectCost(yarnRequirement, yarnChoice, {
      includeHook: includeTools,
      includeNotions: includeTools,
      includeTax,
      taxRate: 0.08
    });
    
    // Calculate time
    const time = calculator.estimateProjectTime(pattern, {
      skillLevel,
      includeBreaks: true,
      sessionsPerDay: 1
    });
    
    // Get yarn comparisons
    const comparisons = calculator.compareYarnOptions(yarnRequirement.consumption.meters);
    
    setCalculations({
      yarnRequirement,
      cost,
      time,
      comparisons
    });
  };
  
  const getYarnWeightName = (weight) => {
    const names = {
      0: 'Lace',
      1: 'Super Fine',
      2: 'Fine',
      3: 'Light',
      4: 'Worsted',
      5: 'Bulky',
      6: 'Super Bulky',
      7: 'Jumbo'
    };
    return names[weight] || 'Unknown';
  };
  
  const renderRequirementsTab = () => {
    if (!calculations?.yarnRequirement) return null;
    
    const req = calculations.yarnRequirement;
    
    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Yarn Requirements</h3>
        
        {/* Consumption Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={statCardStyle('#2196F3')}>
            <div style={statValueStyle}>{req.consumption.meters}m</div>
            <div style={statLabelStyle}>Meters</div>
          </div>
          
          <div style={statCardStyle('#4CAF50')}>
            <div style={statValueStyle}>{req.consumption.yards}yd</div>
            <div style={statLabelStyle}>Yards</div>
          </div>
          
          <div style={statCardStyle('#FF9800')}>
            <div style={statValueStyle}>{req.consumption.grams}g</div>
            <div style={statLabelStyle}>Grams</div>
          </div>
          
          <div style={statCardStyle('#9C27B0')}>
            <div style={statValueStyle}>{req.skeins.needed}</div>
            <div style={statLabelStyle}>Skeins Min</div>
          </div>
        </div>
        
        {/* Details */}
        <div style={{
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Calculation Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
            <div>
              <strong>Pattern Stitches:</strong> {req.pattern.stitchCount}
            </div>
            <div>
              <strong>Unique Stitches:</strong> {req.pattern.uniqueStitches}
            </div>
            <div>
              <strong>Recommended Skeins:</strong> {req.skeins.recommended} (includes extra)
            </div>
            <div>
              <strong>Per Skein:</strong> {req.skeins.perSkein.meters}m / {req.skeins.perSkein.grams}g
            </div>
            {req.waste.included && (
              <>
                <div>
                  <strong>Waste Allowance:</strong> {req.waste.percentage}%
                </div>
                <div>
                  <strong>Waste Amount:</strong> {req.waste.meters}m
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Skein Visual */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Skein Visualization</h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {Array.from({ length: req.skeins.recommended }, (_, i) => (
              <div
                key={i}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: i < req.skeins.needed 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                title={i < req.skeins.needed ? 'Required' : 'Extra/Safety'}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            <span style={{ color: '#667eea' }}>● Required</span> · 
            <span style={{ color: '#a8e6cf', marginLeft: '10px' }}>● Extra/Safety</span>
          </div>
        </div>
      </div>
    );
  };
  
  const renderCostTab = () => {
    if (!calculations?.cost) return null;
    
    const cost = calculations.cost;
    
    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Project Cost Estimate</h3>
        
        {/* Cost Breakdown */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
          overflow: 'hidden'
        }}>
          <div style={{
            background: '#f5f5f5',
            padding: '10px 15px',
            borderBottom: '1px solid #ddd',
            fontWeight: 'bold'
          }}>
            Cost Breakdown
          </div>
          
          {/* Yarn Cost */}
          <div style={costLineStyle}>
            <div>
              <strong>{cost.yarn.type}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {cost.yarn.skeins} skeins × ${cost.yarn.pricePerSkein}
              </div>
            </div>
            <div style={{ fontWeight: 'bold' }}>${cost.yarn.total}</div>
          </div>
          
          {/* Tools Cost */}
          {cost.tools.total > 0 && (
            <div style={costLineStyle}>
              <div>
                <strong>Tools & Notions</strong>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {cost.tools.hook > 0 && 'Hook, '}
                  {cost.tools.notions > 0 && 'Needles, Markers, Scissors'}
                </div>
              </div>
              <div style={{ fontWeight: 'bold' }}>${cost.tools.total}</div>
            </div>
          )}
          
          {/* Subtotal */}
          <div style={{ ...costLineStyle, background: '#f9f9f9' }}>
            <div>Subtotal</div>
            <div>${cost.summary.subtotal}</div>
          </div>
          
          {/* Tax */}
          {cost.summary.tax > 0 && (
            <div style={costLineStyle}>
              <div>Tax (8%)</div>
              <div>${cost.summary.tax}</div>
            </div>
          )}
          
          {/* Total */}
          <div style={{
            ...costLineStyle,
            background: '#E3F2FD',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            <div>Total</div>
            <div style={{ color: '#2196F3' }}>${cost.summary.total}</div>
          </div>
        </div>
        
        {/* Cost Distribution Chart */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Cost Distribution</h4>
          <div style={{
            display: 'flex',
            height: '30px',
            borderRadius: '15px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${cost.priceBreakdown.yarnPercentage}%`,
              background: '#667eea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px'
            }}>
              {cost.priceBreakdown.yarnPercentage}%
            </div>
            {parseFloat(cost.priceBreakdown.toolsPercentage) > 0 && (
              <div style={{
                width: `${cost.priceBreakdown.toolsPercentage}%`,
                background: '#764ba2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px'
              }}>
                {cost.priceBreakdown.toolsPercentage}%
              </div>
            )}
            {parseFloat(cost.priceBreakdown.taxPercentage) > 0 && (
              <div style={{
                width: `${cost.priceBreakdown.taxPercentage}%`,
                background: '#9b59b6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px'
              }}>
                {cost.priceBreakdown.taxPercentage}%
              </div>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <span style={{ color: '#667eea' }}>● Yarn</span>
            {parseFloat(cost.priceBreakdown.toolsPercentage) > 0 && (
              <span style={{ color: '#764ba2', marginLeft: '15px' }}>● Tools</span>
            )}
            {parseFloat(cost.priceBreakdown.taxPercentage) > 0 && (
              <span style={{ color: '#9b59b6', marginLeft: '15px' }}>● Tax</span>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderTimeTab = () => {
    if (!calculations?.time) return null;
    
    const time = calculations.time;
    
    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Time Estimate</h3>
        
        {/* Time Overview */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
            {time.total.formatted}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Total Project Time
          </div>
        </div>
        
        {/* Time Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={timeCardStyle}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{time.sessions.count}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Sessions (2hr each)</div>
          </div>
          
          <div style={timeCardStyle}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{time.sessions.days}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Days to Complete</div>
          </div>
          
          <div style={timeCardStyle}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{time.perStitch.speed}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Stitches/Minute</div>
          </div>
          
          <div style={timeCardStyle}>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{time.perStitch.average}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Min per Stitch</div>
          </div>
        </div>
        
        {/* Detailed Breakdown */}
        <div style={{
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Time Allocation</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
            <div>
              <strong>Stitching:</strong> {time.breakdown.stitching} minutes
            </div>
            <div>
              <strong>Setup:</strong> {time.breakdown.setup} minutes
            </div>
            <div>
              <strong>Finishing:</strong> {time.breakdown.finishing} minutes
            </div>
            <div>
              <strong>Breaks:</strong> {time.breakdown.breaks} minutes
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderComparisonTab = () => {
    if (!calculations?.comparisons) return null;
    
    const comp = calculations.comparisons;
    
    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Yarn Options Comparison</h3>
        
        {/* Recommendation */}
        {comp.recommendation && (
          <div style={{
            background: '#E8F5E9',
            border: '1px solid #4CAF50',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>✓</span>
              <div>
                <strong>Recommended: {comp.recommendation.name}</strong>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                  Best value at ${comp.recommendation.totalCost} for {comp.recommendation.skeinsNeeded} skeins
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Comparison Table */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={tableHeaderStyle}>Yarn</th>
                <th style={tableHeaderStyle}>Fiber</th>
                <th style={tableHeaderStyle}>Skeins</th>
                <th style={tableHeaderStyle}>Total Cost</th>
                <th style={tableHeaderStyle}>$/Meter</th>
              </tr>
            </thead>
            <tbody>
              {comp.options.map((option, idx) => (
                <tr key={option.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tableCellStyle}>
                    <strong>{option.name}</strong>
                    {option.id === comp.cheapest.id && (
                      <span style={{ marginLeft: '5px', color: '#4CAF50', fontSize: '11px' }}>
                        (Cheapest)
                      </span>
                    )}
                  </td>
                  <td style={tableCellStyle}>{option.fiber}</td>
                  <td style={tableCellStyle}>{option.skeinsNeeded}</td>
                  <td style={tableCellStyle}>
                    <strong>${option.totalCost}</strong>
                  </td>
                  <td style={tableCellStyle}>${option.costPerMeter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const statCardStyle = (color) => ({
    background: 'white',
    border: `2px solid ${color}`,
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center'
  });
  
  const statValueStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '5px'
  };
  
  const statLabelStyle = {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase'
  };
  
  const costLineStyle = {
    padding: '12px 15px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };
  
  const timeCardStyle = {
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '12px',
    textAlign: 'center'
  };
  
  const tableHeaderStyle = {
    padding: '10px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 'bold'
  };
  
  const tableCellStyle = {
    padding: '10px',
    fontSize: '13px'
  };
  
  if (!pattern || pattern.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🧶</div>
        <h3>No Pattern to Calculate</h3>
        <p style={{ color: '#666' }}>
          Add stitches to your pattern to calculate yarn requirements
        </p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px 8px 0 0'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Yarn Calculator</h2>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Pattern: {pattern.length} stitches · Weight: {getYarnWeightName(yarnWeight)}
        </div>
      </div>
      
      {/* Settings */}
      <div style={{
        background: 'white',
        padding: '15px',
        borderBottom: '1px solid #ddd'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>
              Yarn Weight
            </label>
            <select
              value={yarnWeight}
              onChange={(e) => setYarnWeight(parseInt(e.target.value))}
              style={selectStyle}
            >
              <option value={0}>0 - Lace</option>
              <option value={1}>1 - Super Fine</option>
              <option value={2}>2 - Fine</option>
              <option value={3}>3 - Light</option>
              <option value={4}>4 - Worsted</option>
              <option value={5}>5 - Bulky</option>
              <option value={6}>6 - Super Bulky</option>
              <option value={7}>7 - Jumbo</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>
              Yarn Type
            </label>
            <select
              value={yarnChoice}
              onChange={(e) => setYarnChoice(e.target.value)}
              style={selectStyle}
            >
              <option value="generic-acrylic">Generic Acrylic</option>
              <option value="premium-wool">Premium Wool</option>
              <option value="cotton-blend">Cotton Blend</option>
              <option value="baby-yarn">Baby Soft</option>
              <option value="chunky-wool">Chunky Wool</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>
              Skill Level
            </label>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              style={selectStyle}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '20px',
          marginTop: '15px',
          flexWrap: 'wrap'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={includeWaste}
              onChange={(e) => setIncludeWaste(e.target.checked)}
            />
            Include 10% waste
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={includeTax}
              onChange={(e) => setIncludeTax(e.target.checked)}
            />
            Include tax (8%)
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={includeTools}
              onChange={(e) => setIncludeTools(e.target.checked)}
            />
            Include tools
          </label>
        </div>
      </div>
      
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ddd',
        background: 'white'
      }}>
        {['requirements', 'cost', 'time', 'comparison'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === tab ? 'white' : '#f5f5f5',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #2196F3' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'requirements' && '🧶 Requirements'}
            {tab === 'cost' && '💰 Cost'}
            {tab === 'time' && '⏱️ Time'}
            {tab === 'comparison' && '📊 Compare'}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div style={{ background: '#f5f5f5', minHeight: '400px' }}>
        {activeTab === 'requirements' && renderRequirementsTab()}
        {activeTab === 'cost' && renderCostTab()}
        {activeTab === 'time' && renderTimeTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
      </div>
      
      {/* Actions */}
      <div style={{
        background: 'white',
        padding: '15px',
        borderTop: '1px solid #ddd',
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => {
            const list = calculator?.generateShoppingList(calculations);
            onGenerateShoppingList?.(list);
          }}
          style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📝 Shopping List
        </button>
        
        <button
          onClick={() => onExport?.(calculations)}
          style={{
            padding: '8px 16px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📥 Export
        </button>
      </div>
    </div>
  );
}

const selectStyle = {
  width: '100%',
  padding: '6px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '13px'
};

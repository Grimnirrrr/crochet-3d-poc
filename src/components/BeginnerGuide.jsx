import React, { useState } from 'react';

export function BeginnerGuide({ pattern, currentRound }) {
  const [showTutorials, setShowTutorials] = useState(false);
  const [activeHint, setActiveHint] = useState(null);
  
  // Stitch abbreviation explanations
  const stitchGuide = {
    'sc': {
      name: 'Single Crochet',
      description: 'Insert hook, yarn over, pull through, yarn over, pull through 2 loops',
      difficulty: 'Beginner',
      videoId: 'aAxGTnVNJiE' // YouTube video ID
    },
    'dc': {
      name: 'Double Crochet',
      description: 'Yarn over, insert hook, yarn over, pull through, yarn over, pull through 2, yarn over, pull through 2',
      difficulty: 'Beginner',
      videoId: 'FtUgw3X6bQo'
    },
    'inc': {
      name: 'Increase',
      description: 'Work 2 stitches in the same stitch from previous round',
      difficulty: 'Beginner',
      videoId: 'w9_9MqC8hWg'
    },
    'dec': {
      name: 'Decrease',
      description: 'Work 2 stitches together to reduce by one stitch',
      difficulty: 'Intermediate',
      videoId: '8A0aLLWH7LI'
    },
    'mr': {
      name: 'Magic Ring',
      description: 'Adjustable starting ring that can be tightened to close hole',
      difficulty: 'Beginner',
      videoId: 'y9u6Zg2INLs'
    },
    'magic ring': {
      name: 'Magic Ring',
      description: 'Adjustable starting ring that can be tightened to close hole',
      difficulty: 'Beginner',
      videoId: 'y9u6Zg2INLs'
    }
  };
  
  // Common mistakes based on pattern
  const detectCommonMistakes = () => {
    const mistakes = [];
    
    if (pattern && pattern.length > 0) {
      // Check Round 1
      if (pattern[0].stitches === 6 && !pattern[0].instruction.toLowerCase().includes('magic ring')) {
        mistakes.push({
          type: 'info',
          message: 'Tip: Starting with 6 stitches? Consider using a magic ring for a tighter center!'
        });
      }
      
      // Check for large increases
      for (let i = 1; i < pattern.length; i++) {
        const prev = pattern[i - 1].stitches;
        const curr = pattern[i].stitches;
        
        if (curr > prev * 2) {
          mistakes.push({
            type: 'warning',
            message: `Round ${i + 1}: Large increase detected. Make sure to distribute increases evenly!`
          });
        }
        
        if (curr < prev * 0.5) {
          mistakes.push({
            type: 'warning',
            message: `Round ${i + 1}: Large decrease detected. This will create a sharp angle.`
          });
        }
      }
      
      // Check if working in continuous rounds
      if (pattern.length > 3 && !pattern[0].instruction.includes('join')) {
        mistakes.push({
          type: 'info',
          message: 'Working in continuous rounds? Use a stitch marker to track your starting point!'
        });
      }
    }
    
    return mistakes;
  };
  
  const mistakes = detectCommonMistakes();
  
  // Get hints for current round
  const getCurrentRoundHints = () => {
    if (!pattern || currentRound === 0) return [];
    
    const hints = [];
    const round = pattern[currentRound - 1];
    
    if (round) {
      if (round.hasIncrease) {
        hints.push('This round has increases - space them evenly for a smooth shape');
      }
      if (round.hasDecrease) {
        hints.push('This round has decreases - they will create shaping');
      }
      if (round.stitches > 50) {
        hints.push('Large round! Take breaks to avoid hand fatigue');
      }
      if (currentRound === 1) {
        hints.push('First round sets the foundation - count carefully!');
      }
    }
    
    return hints;
  };
  
  const roundHints = getCurrentRoundHints();
  
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
        color: '#fbbf24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        🎓 Beginner Guide
        <button
          onClick={() => setShowTutorials(!showTutorials)}
          style={{
            padding: '4px 8px',
            background: 'rgba(251, 191, 36, 0.2)',
            border: '1px solid #fbbf24',
            borderRadius: '4px',
            color: '#fbbf24',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {showTutorials ? 'Hide' : 'Show'} Tutorials
        </button>
      </h2>
      
      {/* Current Round Hints */}
      {roundHints.length > 0 && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          background: 'rgba(16, 185, 129, 0.2)',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          <strong>💡 Current Round Tips:</strong>
          {roundHints.map((hint, idx) => (
            <div key={idx} style={{ marginTop: '5px' }}>
              • {hint}
            </div>
          ))}
        </div>
      )}
      
      {/* Common Mistakes */}
      {mistakes.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{
            fontSize: '14px',
            marginBottom: '10px',
            color: '#fbbf24',
            opacity: 0.9
          }}>
            ⚠️ Pattern Check:
          </h3>
          {mistakes.map((mistake, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px',
                marginBottom: '5px',
                background: mistake.type === 'warning' 
                  ? 'rgba(239, 68, 68, 0.2)' 
                  : 'rgba(99, 102, 241, 0.2)',
                borderLeft: `3px solid ${mistake.type === 'warning' ? '#ef4444' : '#6366f1'}`,
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              {mistake.message}
            </div>
          ))}
        </div>
      )}
      
      {/* Stitch Tutorials */}
      {showTutorials && (
        <div>
          <h3 style={{
            fontSize: '14px',
            marginBottom: '10px',
            color: '#fbbf24',
            opacity: 0.9
          }}>
            📚 Stitch Tutorials:
          </h3>
          <div style={{
            display: 'grid',
            gap: '10px'
          }}>
            {Object.entries(stitchGuide).slice(0, 5).map(([abbr, info]) => (
              <div
                key={abbr}
                style={{
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onClick={() => setActiveHint(activeHint === abbr ? null : abbr)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '5px'
                }}>
                  <strong style={{ color: '#fbbf24' }}>{info.name} ({abbr})</strong>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: 'rgba(251, 191, 36, 0.2)',
                    borderRadius: '3px'
                  }}>
                    {info.difficulty}
                  </span>
                </div>
                
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {info.description}
                </div>
                
                {activeHint === abbr && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    borderRadius: '4px'
                  }}>
                    <a
                      href={`https://www.youtube.com/watch?v=${info.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#6366f1',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      📺 Watch video tutorial →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* General Tips */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <strong>🌟 General Tips:</strong>
        <ul style={{ margin: '10px 0 0 20px', lineHeight: '1.6' }}>
          <li>Count your stitches after each round</li>
          <li>Use stitch markers to track increases</li>
          <li>Keep consistent tension for even stitches</li>
          <li>Take photos of your progress</li>
          <li>Don't be afraid to unravel and redo!</li>
        </ul>
      </div>
    </div>
  );
}
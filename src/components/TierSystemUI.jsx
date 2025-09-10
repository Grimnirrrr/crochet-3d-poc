// src/components/TierSystemUI.jsx
// D6: Tier System UI for managing subscription tiers

import React, { useState } from 'react';

export function TierSystemUI({
  currentTier = 'freemium',
  usageStats = {},
  onTierUpgrade,
  onPayPerUse,
  assembly
}) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  
  // Tier definitions
  const tiers = {
    freemium: {
      name: 'Freemium',
      color: '#9ca3af',
      icon: '🆓',
      limits: {
        maxPieces: 10,
        maxSaves: 0,
        customPieces: 0,
        templates: 'Basic Only'
      },
      price: '$0/month'
    },
    pro: {
      name: 'Pro',
      color: '#10b981',
      icon: '⭐',
      limits: {
        maxPieces: 25,
        maxSaves: 10,
        customPieces: 10,
        templates: 'All Templates'
      },
      price: '$5/month',
      payPerUse: '$0.02/piece over limit'
    },
    studio: {
      name: 'Studio',
      color: '#8b5cf6',
      icon: '👑',
      limits: {
        maxPieces: 50,
        maxSaves: 25,
        customPieces: 'Unlimited',
        templates: 'All + Priority'
      },
      price: '$15/month'
    }
  };
  
  const currentTierData = tiers[currentTier];
  
  // Calculate usage percentages
  const pieceUsage = usageStats.pieces ? 
    (usageStats.pieces.used / usageStats.pieces.limit) * 100 : 0;
  const saveUsage = usageStats.saves ? 
    (usageStats.saves.used / Math.max(usageStats.saves.limit, 1)) * 100 : 0;
  const customUsage = usageStats.customPieces ? 
    (usageStats.customPieces.used / Math.max(usageStats.customPieces.limit || 1, 1)) * 100 : 0;
  
  const handleUpgrade = (tier) => {
    setSelectedUpgrade(tier);
    setShowUpgradeModal(true);
  };
  
  const confirmUpgrade = () => {
    if (onTierUpgrade && selectedUpgrade) {
      onTierUpgrade(selectedUpgrade);
      
      // Update assembly tier if available
      if (assembly) {
        assembly.setTier(selectedUpgrade);
      }
    }
    setShowUpgradeModal(false);
    setSelectedUpgrade(null);
  };
  
  return (
    <>
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '240px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        minWidth: '280px',
        maxWidth: '320px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 999,
        border: `2px solid ${currentTierData.color}`
      }}>
        {/* Current Tier Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
          paddingBottom: '10px',
          borderBottom: `1px solid ${currentTierData.color}`
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: '16px',
            color: currentTierData.color,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>{currentTierData.icon}</span>
            {currentTierData.name} Tier
          </h3>
          <span style={{
            fontSize: '11px',
            color: '#888'
          }}>
            {currentTierData.price}
          </span>
        </div>
        
        {/* Usage Stats */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
            Current Usage
          </div>
          
          {/* Pieces Usage */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '3px',
              fontSize: '11px'
            }}>
              <span>Pieces</span>
              <span style={{ color: pieceUsage > 90 ? '#ef4444' : '#10b981' }}>
                {usageStats.pieces?.used || 0} / {usageStats.pieces?.limit || 0}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: '#333',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(pieceUsage, 100)}%`,
                height: '100%',
                background: pieceUsage > 90 ? '#ef4444' : 
                           pieceUsage > 70 ? '#f59e0b' : '#10b981',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
          
          {/* Saves Usage */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '3px',
              fontSize: '11px'
            }}>
              <span>Saves</span>
              <span style={{ 
                color: currentTier === 'freemium' ? '#666' : 
                       saveUsage > 90 ? '#ef4444' : '#10b981' 
              }}>
                {usageStats.saves?.used || 0} / {usageStats.saves?.limit || 0}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: '#333',
              borderRadius: '3px',
              overflow: 'hidden',
              opacity: currentTier === 'freemium' ? 0.5 : 1
            }}>
              <div style={{
                width: `${currentTier === 'freemium' ? 0 : Math.min(saveUsage, 100)}%`,
                height: '100%',
                background: saveUsage > 90 ? '#ef4444' : 
                           saveUsage > 70 ? '#f59e0b' : '#10b981',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
          
          {/* Custom Pieces Usage */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '3px',
              fontSize: '11px'
            }}>
              <span>Custom Pieces</span>
              <span style={{ 
                color: currentTier === 'freemium' ? '#666' :
                       currentTier === 'studio' ? '#8b5cf6' :
                       customUsage > 90 ? '#ef4444' : '#10b981' 
              }}>
                {currentTier === 'studio' ? '∞' : 
                 `${usageStats.customPieces?.used || 0} / ${usageStats.customPieces?.limit || 0}`}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: '#333',
              borderRadius: '3px',
              overflow: 'hidden',
              opacity: currentTier === 'freemium' ? 0.5 : 1
            }}>
              <div style={{
                width: currentTier === 'studio' ? '100%' :
                       currentTier === 'freemium' ? '0%' :
                       `${Math.min(customUsage, 100)}%`,
                height: '100%',
                background: currentTier === 'studio' ? '#8b5cf6' :
                           customUsage > 90 ? '#ef4444' : 
                           customUsage > 70 ? '#f59e0b' : '#10b981',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        </div>
        
        {/* Pay Per Use Cost (Pro tier only) */}
        {currentTier === 'pro' && usageStats.cost?.extraPieces > 0 && (
          <div style={{
            padding: '10px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '6px',
            marginBottom: '15px',
            border: '1px solid #f59e0b'
          }}>
            <div style={{ fontSize: '11px', marginBottom: '5px' }}>
              Pay-Per-Use Active
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '10px', color: '#888' }}>
                {usageStats.cost.extraPieces} extra pieces
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: '#f59e0b',
                fontWeight: 'bold'
              }}>
                ${usageStats.cost.total.toFixed(2)}
              </span>
            </div>
          </div>
        )}
        
        {/* Features List */}
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
          fontSize: '10px'
        }}>
          <div style={{ color: currentTierData.color, marginBottom: '8px', fontSize: '11px' }}>
            Your Features
          </div>
          <div style={{ display: 'grid', gap: '5px' }}>
            <div>✓ {currentTierData.limits.maxPieces} pieces max</div>
            <div style={{ opacity: currentTier === 'freemium' ? 0.5 : 1 }}>
              {currentTier === 'freemium' ? '✗' : '✓'} {currentTierData.limits.maxSaves} saves
            </div>
            <div style={{ opacity: currentTier === 'freemium' ? 0.5 : 1 }}>
              {currentTier === 'freemium' ? '✗' : '✓'} Custom pieces: {currentTierData.limits.customPieces}
            </div>
            <div>✓ {currentTierData.limits.templates}</div>
            {currentTier === 'pro' && (
              <div style={{ color: '#f59e0b' }}>✓ Pay-per-use available</div>
            )}
            {currentTier === 'studio' && (
              <div style={{ color: '#8b5cf6' }}>✓ Priority support</div>
            )}
          </div>
        </div>
        
        {/* Upgrade Options */}
        {currentTier !== 'studio' && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              fontSize: '11px', 
              color: '#888', 
              marginBottom: '8px' 
            }}>
              Upgrade Options
            </div>
            
            {currentTier === 'freemium' && (
              <>
                <button
                  onClick={() => handleUpgrade('pro')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '8px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={e => e.target.style.transform = 'scale(1.02)'}
                  onMouseOut={e => e.target.style.transform = 'scale(1)'}
                >
                  ⭐ Upgrade to Pro - $5/mo
                </button>
                <button
                  onClick={() => handleUpgrade('studio')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={e => e.target.style.transform = 'scale(1.02)'}
                  onMouseOut={e => e.target.style.transform = 'scale(1)'}
                >
                  👑 Upgrade to Studio - $15/mo
                </button>
              </>
            )}
            
            {currentTier === 'pro' && (
              <button
                onClick={() => handleUpgrade('studio')}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={e => e.target.style.transform = 'scale(1.02)'}
                onMouseOut={e => e.target.style.transform = 'scale(1)'}
              >
                👑 Upgrade to Studio - $15/mo
              </button>
            )}
          </div>
        )}
        
        {/* Quick Actions */}
        {currentTier === 'pro' && pieceUsage >= 100 && (
          <button
            onClick={onPayPerUse}
            style={{
              width: '100%',
              padding: '6px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              border: '1px solid #f59e0b',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Continue with Pay-Per-Use ($0.02/piece)
          </button>
        )}
      </div>
      
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '400px',
            border: `2px solid ${tiers[selectedUpgrade]?.color}`,
            color: 'white'
          }}>
            <h2 style={{ 
              margin: '0 0 20px 0',
              color: tiers[selectedUpgrade]?.color
            }}>
              Upgrade to {tiers[selectedUpgrade]?.name}
            </h2>
            
            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
              <p>You're about to upgrade to the {tiers[selectedUpgrade]?.name} tier.</p>
              <p style={{ color: '#10b981', fontWeight: 'bold' }}>
                {tiers[selectedUpgrade]?.price}
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowUpgradeModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                style={{
                  padding: '8px 16px',
                  background: tiers[selectedUpgrade]?.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Confirm Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TierSystemUI;
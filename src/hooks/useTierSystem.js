// src/hooks/useTierSystem.js
// React hook for tier system management

import { useState, useCallback, useEffect } from 'react';

export function useTierSystem(assembly) {
  const [currentTier, setCurrentTier] = useState('freemium');
  const [usageStats, setUsageStats] = useState({
    pieces: { used: 0, limit: 10 },
    saves: { used: 0, limit: 0 },
    customPieces: { used: 0, limit: 0 },
    cost: { extraPieces: 0, total: 0 }
  });
  const [tierHistory, setTierHistory] = useState([]);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  
  // Tier limits configuration
  const TIER_LIMITS = {
    freemium: {
      maxPieces: 10,
      maxSaves: 0,
      customPieces: 0,
      templates: ['basic'],
      price: 0
    },
    pro: {
      maxPieces: 25,
      maxSaves: 10,
      customPieces: 10,
      templates: ['basic', 'advanced'],
      payPerUse: 0.02,
      price: 5
    },
    studio: {
      maxPieces: 50,
      maxSaves: 25,
      customPieces: Infinity,
      templates: ['basic', 'advanced', 'premium'],
      priority: true,
      price: 15
    }
  };
  
  // Initialize from assembly
  useEffect(() => {
    if (assembly) {
      const tier = assembly.currentTier || 'freemium';
      setCurrentTier(tier);
      updateUsageStats(tier);
      
      // Listen for assembly changes
      const handleAssemblyChange = () => {
        updateUsageStats(currentTier);
      };
      
      // Check if assembly has event emitter (you might need to add this)
      if (assembly.on) {
        assembly.on('change', handleAssemblyChange);
        return () => assembly.off('change', handleAssemblyChange);
      }
    }
  }, [assembly]);
  
  // Update usage statistics
  const updateUsageStats = useCallback((tier = currentTier) => {
    if (!assembly) return;
    
    const limits = TIER_LIMITS[tier];
    const pieces = assembly.pieces ? assembly.pieces.size : 0;
    const saves = assembly.saveCount || 0;
    const customPieces = assembly.customPieceCount || 0;
    
    // Calculate pay-per-use costs for Pro tier
    let extraPieces = 0;
    let totalCost = 0;
    
    if (tier === 'pro' && pieces > limits.maxPieces) {
      extraPieces = pieces - limits.maxPieces;
      totalCost = extraPieces * TIER_LIMITS.pro.payPerUse;
    }
    
    setUsageStats({
      pieces: { 
        used: pieces, 
        limit: limits.maxPieces,
        percentage: (pieces / limits.maxPieces) * 100
      },
      saves: { 
        used: saves, 
        limit: limits.maxSaves,
        percentage: limits.maxSaves > 0 ? (saves / limits.maxSaves) * 100 : 0
      },
      customPieces: { 
        used: customPieces, 
        limit: limits.customPieces === Infinity ? 'Unlimited' : limits.customPieces,
        percentage: limits.customPieces === Infinity ? 0 : 
                   (customPieces / limits.customPieces) * 100
      },
      cost: { 
        extraPieces, 
        total: totalCost 
      }
    });
    
    // Check if approaching limits
    if (pieces >= limits.maxPieces * 0.9 && tier !== 'studio') {
      setShowLimitWarning(true);
    }
  }, [assembly, currentTier]);
  
  // Upgrade tier
  const upgradeTier = useCallback((newTier) => {
    if (!TIER_LIMITS[newTier]) {
      console.error('Invalid tier:', newTier);
      return false;
    }
    
    const oldTier = currentTier;
    setCurrentTier(newTier);
    
    // Update assembly if available
    if (assembly) {
      assembly.setTier(newTier);
    }
    
    // Record in history
    setTierHistory(prev => [...prev, {
      from: oldTier,
      to: newTier,
      timestamp: Date.now(),
      reason: 'manual_upgrade'
    }]);
    
    // Update stats with new tier
    updateUsageStats(newTier);
    
    // Clear warning if upgrading
    if (newTier !== 'freemium') {
      setShowLimitWarning(false);
    }
    
    console.log(`Tier upgraded from ${oldTier} to ${newTier}`);
    return true;
  }, [currentTier, assembly, updateUsageStats]);
  
  // Check if operation is allowed
  const canPerformOperation = useCallback((operation, count = 1) => {
    const limits = TIER_LIMITS[currentTier];
    
    switch (operation) {
      case 'addPiece':
        if (currentTier === 'pro' && usageStats.pieces.used >= limits.maxPieces) {
          // Pro tier can use pay-per-use
          return { 
            allowed: true, 
            requiresPayment: true, 
            cost: count * TIER_LIMITS.pro.payPerUse 
          };
        }
        return { 
          allowed: usageStats.pieces.used + count <= limits.maxPieces,
          requiresPayment: false
        };
        
      case 'save':
        return { 
          allowed: usageStats.saves.used < limits.maxSaves || currentTier === 'studio',
          requiresPayment: false
        };
        
      case 'addCustomPiece':
        return { 
          allowed: currentTier === 'studio' || 
                  usageStats.customPieces.used < limits.customPieces,
          requiresPayment: false
        };
        
      case 'useTemplate':
        return (templateType) => {
          return { 
            allowed: limits.templates.includes(templateType),
            requiresPayment: false
          };
        };
        
      default:
        return { allowed: true, requiresPayment: false };
    }
  }, [currentTier, usageStats]);
  
  // Process pay-per-use payment
  const processPayPerUse = useCallback((pieces = 1) => {
    if (currentTier !== 'pro') {
      console.error('Pay-per-use only available for Pro tier');
      return false;
    }
    
    const cost = pieces * TIER_LIMITS.pro.payPerUse;
    
    // In real app, this would process payment
    console.log(`Processing pay-per-use: ${pieces} pieces for $${cost.toFixed(2)}`);
    
    // Update cost tracking
    setUsageStats(prev => ({
      ...prev,
      cost: {
        extraPieces: prev.cost.extraPieces + pieces,
        total: prev.cost.total + cost
      }
    }));
    
    return true;
  }, [currentTier]);
  
  // Get available templates for current tier
  const getAvailableTemplates = useCallback(() => {
    return TIER_LIMITS[currentTier].templates;
  }, [currentTier]);
  
  // Check if user should be prompted to upgrade
  const shouldPromptUpgrade = useCallback(() => {
    if (currentTier === 'studio') return false;
    
    // Check if at or over limits
    const limits = TIER_LIMITS[currentTier];
    return usageStats.pieces.used >= limits.maxPieces ||
           usageStats.saves.used >= limits.maxSaves ||
           (limits.customPieces > 0 && usageStats.customPieces.used >= limits.customPieces);
  }, [currentTier, usageStats]);
  
  // Get upgrade benefits
  const getUpgradeBenefits = useCallback((targetTier) => {
    if (!TIER_LIMITS[targetTier]) return null;
    
    const current = TIER_LIMITS[currentTier];
    const target = TIER_LIMITS[targetTier];
    
    return {
      additionalPieces: target.maxPieces - current.maxPieces,
      additionalSaves: target.maxSaves - current.maxSaves,
      additionalCustom: target.customPieces === Infinity ? 'Unlimited' : 
                       target.customPieces - current.customPieces,
      newTemplates: target.templates.filter(t => !current.templates.includes(t)),
      payPerUse: targetTier === 'pro' && currentTier === 'freemium',
      priority: targetTier === 'studio'
    };
  }, [currentTier]);
  
  // Reset usage (for testing or new projects)
  const resetUsage = useCallback(() => {
    setUsageStats({
      pieces: { used: 0, limit: TIER_LIMITS[currentTier].maxPieces },
      saves: { used: 0, limit: TIER_LIMITS[currentTier].maxSaves },
      customPieces: { used: 0, limit: TIER_LIMITS[currentTier].customPieces },
      cost: { extraPieces: 0, total: 0 }
    });
    setShowLimitWarning(false);
  }, [currentTier]);
  
  return {
    // State
    currentTier,
    usageStats,
    tierHistory,
    showLimitWarning,
    tierLimits: TIER_LIMITS[currentTier],
    
    // Methods
    upgradeTier,
    canPerformOperation,
    processPayPerUse,
    getAvailableTemplates,
    shouldPromptUpgrade,
    getUpgradeBenefits,
    updateUsageStats,
    resetUsage,
    
    // Constants
    TIER_LIMITS
  };
}

export default useTierSystem;

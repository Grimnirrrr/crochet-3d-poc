// src/utils/tierEnforcement.js

/**
 * D0.5: Tier Enforcement Middleware
 * Enforces piece limits, save restrictions, and pay-per-use tracking
 * Part of v7.0 Prevention Layer (Phase 0)
 */

// Tier limit definitions
const TIER_LIMITS = {
  freemium: {
    maxPieces: 10,
    maxSaves: 0,
    customPieces: 0,
    name: 'Freemium',
    monthlyPrice: 0
  },
  pro: {
    maxPieces: 25,
    maxSaves: 10,
    customPieces: 10,
    name: 'Pro',
    monthlyPrice: 5,
    overageRate: 0.02 // $0.02 per extra piece
  },
  studio: {
    maxPieces: 50,
    maxSaves: 25,
    customPieces: Infinity,
    name: 'Studio',
    monthlyPrice: 15,
    overageRate: 0.01 // $0.01 per extra piece (discounted)
  }
};

/**
 * Track usage statistics for current session
 */
class UsageTracker {
  constructor(tier = 'freemium') {
    this.tier = tier;
    this.piecesUsed = 0;
    this.savesUsed = 0;
    this.customPiecesUsed = 0;
    this.extraPiecesUsed = 0;
    this.sessionStarted = Date.now();
    this.warnings = [];
  }

  incrementPieces() {
    this.piecesUsed++;
    const limit = TIER_LIMITS[this.tier].maxPieces;
    
    if (this.piecesUsed > limit) {
      this.extraPiecesUsed = this.piecesUsed - limit;
      return {
        allowed: this.tier !== 'freemium', // Only allow overage for paid tiers
        overage: true,
        extraCost: this.calculateOverageCost()
      };
    }
    
    return { allowed: true, overage: false };
  }

  incrementSaves() {
    this.savesUsed++;
    const limit = TIER_LIMITS[this.tier].maxSaves;
    
    return {
      allowed: this.savesUsed <= limit,
      remaining: Math.max(0, limit - this.savesUsed)
    };
  }

  calculateOverageCost() {
    if (this.extraPiecesUsed <= 0) return 0;
    const rate = TIER_LIMITS[this.tier].overageRate || 0;
    return (this.extraPiecesUsed * rate).toFixed(2);
  }

  getUsageStats() {
    const limits = TIER_LIMITS[this.tier];
    return {
      tier: this.tier,
      pieces: {
        used: this.piecesUsed,
        limit: limits.maxPieces,
        remaining: Math.max(0, limits.maxPieces - this.piecesUsed),
        overage: this.extraPiecesUsed
      },
      saves: {
        used: this.savesUsed,
        limit: limits.maxSaves,
        remaining: Math.max(0, limits.maxSaves - this.savesUsed)
      },
      customPieces: {
        used: this.customPiecesUsed,
        limit: limits.customPieces
      },
      cost: {
        monthly: limits.monthlyPrice,
        overage: this.calculateOverageCost(),
        total: limits.monthlyPrice + parseFloat(this.calculateOverageCost())
      },
      warnings: this.warnings
    };
  }

  addWarning(message) {
    this.warnings.push({
      message,
      timestamp: Date.now()
    });
  }
}

// Global usage tracker instance
let currentUsageTracker = null;

/**
 * Initialize or get current usage tracker
 */
export function getUsageTracker(tier = 'freemium') {
  if (!currentUsageTracker || currentUsageTracker.tier !== tier) {
    currentUsageTracker = new UsageTracker(tier);
  }
  return currentUsageTracker;
}

/**
 * Guarded version of addPiece that enforces tier limits
 */
export function guardedAddPiece(assembly, piece, currentTier = 'freemium') {
  const tracker = getUsageTracker(currentTier);
  const pieceCount = assembly.pieces ? assembly.pieces.size : 0;
  
  // Check if adding this piece would exceed limits
  const result = tracker.incrementPieces();
  
  if (!result.allowed) {
    // Freemium tier - hard block
    return {
      success: false,
      reason: 'TIER_LIMIT_EXCEEDED',
      message: `Freemium tier limit reached (${TIER_LIMITS.freemium.maxPieces} pieces). Upgrade to Pro to continue.`,
      showUpgrade: true,
      stats: tracker.getUsageStats()
    };
  }
  
  if (result.overage) {
    // Pro/Studio tier - allow but track overage
    tracker.addWarning(`Extra piece added. Cost: $${result.extraCost}`);
    
    // Actually add the piece (assuming assembly has an addPiece method)
    const added = assembly._directAddPiece ? assembly._directAddPiece(piece) : true;
    
    return {
      success: added,
      reason: 'OVERAGE_CHARGE',
      message: `Extra piece added. Additional charge: $${result.extraCost}`,
      overageCost: result.extraCost,
      stats: tracker.getUsageStats()
    };
  }
  
  // Within limits - add normally
  const added = assembly._directAddPiece ? assembly._directAddPiece(piece) : true;
  
  return {
    success: added,
    reason: 'WITHIN_LIMITS',
    stats: tracker.getUsageStats()
  };
}

/**
 * Guarded version of connect that wraps validation
 */
export function guardedConnect(assembly, piece1Id, point1Id, piece2Id, point2Id, validator, currentTier = 'freemium') {
  // First check if connection is valid using the validator
  if (validator) {
    const validation = validator(piece1Id, point1Id, piece2Id, point2Id);
    if (!validation.valid) {
      return {
        success: false,
        reason: 'INVALID_CONNECTION',
        message: validation.reason
      };
    }
  }
  
  // Check tier-specific connection rules
  const tracker = getUsageTracker(currentTier);
  
  // Freemium users might have limited connection types
  if (currentTier === 'freemium') {
    // Could add restrictions here, like no custom connection points
    const piece1 = assembly.pieces?.get(piece1Id);
    const piece2 = assembly.pieces?.get(piece2Id);
    
    if (piece1?.isCustom || piece2?.isCustom) {
      return {
        success: false,
        reason: 'TIER_RESTRICTION',
        message: 'Custom pieces require Pro tier or higher',
        showUpgrade: true
      };
    }
  }
  
  // Perform the connection
const connected = assembly._directConnect ? 
  assembly._directConnect(piece1Id, point1Id, piece2Id, point2Id) : true;
    
  return {
    success: connected,
    reason: connected ? 'CONNECTION_SUCCESSFUL' : 'CONNECTION_FAILED',
    stats: tracker.getUsageStats()
  };
}

/**
 * Guarded save operation
 */
export function guardedSave(assembly, currentTier = 'freemium') {
  const tracker = getUsageTracker(currentTier);
  const saveResult = tracker.incrementSaves();
  
  if (!saveResult.allowed) {
    return {
      success: false,
      reason: 'SAVE_LIMIT_EXCEEDED',
      message: `Save limit reached (${TIER_LIMITS[currentTier].maxSaves} saves). ${
        currentTier === 'freemium' ? 'Upgrade to Pro to save projects.' : 
        'Upgrade to Studio for more saves.'
      }`,
      showUpgrade: true,
      stats: tracker.getUsageStats()
    };
  }
  
  // Perform the save (this would call the actual save logic)
  return {
    success: true,
    reason: 'SAVE_SUCCESSFUL',
    remaining: saveResult.remaining,
    message: `Project saved. ${saveResult.remaining} saves remaining.`,
    stats: tracker.getUsageStats()
  };
}

/**
 * Check if an operation would exceed limits without performing it
 */
export function checkLimits(operation, currentTier = 'freemium') {
  const tracker = getUsageTracker(currentTier);
  const limits = TIER_LIMITS[currentTier];
  
  switch (operation) {
    case 'ADD_PIECE':
      return {
        allowed: tracker.piecesUsed < limits.maxPieces || currentTier !== 'freemium',
        remaining: Math.max(0, limits.maxPieces - tracker.piecesUsed),
        willCharge: tracker.piecesUsed >= limits.maxPieces && currentTier !== 'freemium'
      };
      
    case 'SAVE':
      return {
        allowed: tracker.savesUsed < limits.maxSaves,
        remaining: Math.max(0, limits.maxSaves - tracker.savesUsed)
      };
      
    case 'ADD_CUSTOM':
      return {
        allowed: tracker.customPiecesUsed < limits.customPieces,
        remaining: limits.customPieces === Infinity ? 'Unlimited' : 
                  Math.max(0, limits.customPieces - tracker.customPiecesUsed)
      };
      
    default:
      return { allowed: true };
  }
}

/**
 * Generate upgrade prompt based on current tier and attempted operation
 */
export function getUpgradePrompt(currentTier, operation) {
  const prompts = {
    freemium: {
      ADD_PIECE: {
        title: 'Upgrade to Pro',
        message: 'You\'ve reached the 10-piece limit for free accounts.',
        benefits: [
          '25 pieces per project',
          '10 project saves',
          '10 custom pieces',
          'Pay-per-use for extra pieces ($0.02 each)'
        ],
        cta: 'Upgrade for $5/month',
        alternative: 'Remove existing pieces to continue'
      },
      SAVE: {
        title: 'Upgrade to Save',
        message: 'Saving projects requires a Pro account.',
        benefits: [
          'Save up to 10 projects',
          'Access saved projects anytime',
          'Export to multiple formats',
          'Version history'
        ],
        cta: 'Upgrade for $5/month',
        alternative: 'Export pattern as PDF instead'
      }
    },
    pro: {
      ADD_PIECE: {
        title: 'Piece Limit Reached',
        message: 'You\'ve used all 25 pieces in your Pro plan.',
        options: [
          'Continue with pay-per-use ($0.02 per extra piece)',
          'Upgrade to Studio for 50 pieces ($15/month)',
          'Remove existing pieces'
        ],
        cta: 'Continue ($0.02/piece)',
        alternative: 'Upgrade to Studio'
      },
      SAVE: {
        title: 'Upgrade to Studio',
        message: 'You\'ve used all 10 saves in your Pro plan.',
        benefits: [
          '25 project saves',
          '50 pieces per project',
          'Unlimited custom pieces',
          'Priority support'
        ],
        cta: 'Upgrade for $15/month',
        alternative: 'Delete old saves'
      }
    }
  };
  
  return prompts[currentTier]?.[operation] || {
    title: 'Limit Reached',
    message: 'You\'ve reached a tier limit.',
    cta: 'View Upgrade Options'
  };
}

/**
 * Reset usage tracker (for new projects or testing)
 */
export function resetUsageTracker(tier = 'freemium') {
  currentUsageTracker = new UsageTracker(tier);
  return currentUsageTracker;
}

/**
 * Export current usage for persistence
 */
export function exportUsage() {
  if (!currentUsageTracker) return null;
  
  return {
    tier: currentUsageTracker.tier,
    piecesUsed: currentUsageTracker.piecesUsed,
    savesUsed: currentUsageTracker.savesUsed,
    customPiecesUsed: currentUsageTracker.customPiecesUsed,
    extraPiecesUsed: currentUsageTracker.extraPiecesUsed,
    sessionStarted: currentUsageTracker.sessionStarted
  };
}

/**
 * Import usage from saved data
 */
export function importUsage(data) {
  if (!data) return;
  
  currentUsageTracker = new UsageTracker(data.tier);
  currentUsageTracker.piecesUsed = data.piecesUsed || 0;
  currentUsageTracker.savesUsed = data.savesUsed || 0;
  currentUsageTracker.customPiecesUsed = data.customPiecesUsed || 0;
  currentUsageTracker.extraPiecesUsed = data.extraPiecesUsed || 0;
  currentUsageTracker.sessionStarted = data.sessionStarted || Date.now();
  
  return currentUsageTracker;
}
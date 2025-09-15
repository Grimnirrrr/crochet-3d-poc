// src/utils/yarnCalculator.js
// D17: Yarn requirement calculations and cost estimation

export class YarnCalculator {
  constructor() {
    this.yarnWeights = new Map();
    this.hookSizes = new Map();
    this.stitchConsumption = new Map();
    this.yarnDatabase = new Map();
    this.gaugeDefaults = new Map();
    this.currency = 'USD';
    
    this.initializeYarnWeights();
    this.initializeHookSizes();
    this.initializeStitchConsumption();
    this.initializeYarnDatabase();
    this.initializeGaugeDefaults();
  }
  
  initializeYarnWeights() {
    // Standard yarn weight categories (CYC system)
    this.yarnWeights.set(0, {
      name: 'Lace',
      ply: '1-3',
      wpi: '18+', // Wraps per inch
      meters100g: 600,
      yards100g: 656,
      hookRange: { min: 1.5, max: 2.25 }, // mm
      gauge4inch: { min: 32, max: 42 } // stitches
    });
    
    this.yarnWeights.set(1, {
      name: 'Super Fine',
      ply: '4',
      wpi: '14-18',
      meters100g: 400,
      yards100g: 437,
      hookRange: { min: 2.25, max: 3.5 },
      gauge4inch: { min: 27, max: 32 }
    });
    
    this.yarnWeights.set(2, {
      name: 'Fine',
      ply: '5',
      wpi: '12-14',
      meters100g: 300,
      yards100g: 328,
      hookRange: { min: 3.5, max: 4.5 },
      gauge4inch: { min: 23, max: 26 }
    });
    
    this.yarnWeights.set(3, {
      name: 'Light',
      ply: '8',
      wpi: '11-12',
      meters100g: 250,
      yards100g: 273,
      hookRange: { min: 4.5, max: 5.5 },
      gauge4inch: { min: 16, max: 20 }
    });
    
    this.yarnWeights.set(4, {
      name: 'Medium/Worsted',
      ply: '10',
      wpi: '9-11',
      meters100g: 190,
      yards100g: 207,
      hookRange: { min: 5.5, max: 6.5 },
      gauge4inch: { min: 12, max: 17 }
    });
    
    this.yarnWeights.set(5, {
      name: 'Bulky',
      ply: '12',
      wpi: '6-9',
      meters100g: 120,
      yards100g: 131,
      hookRange: { min: 6.5, max: 9 },
      gauge4inch: { min: 8, max: 12 }
    });
    
    this.yarnWeights.set(6, {
      name: 'Super Bulky',
      ply: '14+',
      wpi: '5-6',
      meters100g: 70,
      yards100g: 76,
      hookRange: { min: 9, max: 15 },
      gauge4inch: { min: 5, max: 9 }
    });
    
    this.yarnWeights.set(7, {
      name: 'Jumbo',
      ply: '16+',
      wpi: '<5',
      meters100g: 40,
      yards100g: 44,
      hookRange: { min: 15, max: 25 },
      gauge4inch: { min: 3, max: 5 }
    });
  }
  
  initializeHookSizes() {
    // Hook sizes with US and metric equivalents
    this.hookSizes.set('B/1', { mm: 2.25, us: 'B/1' });
    this.hookSizes.set('C/2', { mm: 2.75, us: 'C/2' });
    this.hookSizes.set('D/3', { mm: 3.25, us: 'D/3' });
    this.hookSizes.set('E/4', { mm: 3.5, us: 'E/4' });
    this.hookSizes.set('F/5', { mm: 3.75, us: 'F/5' });
    this.hookSizes.set('G/6', { mm: 4, us: 'G/6' });
    this.hookSizes.set('7', { mm: 4.5, us: '7' });
    this.hookSizes.set('H/8', { mm: 5, us: 'H/8' });
    this.hookSizes.set('I/9', { mm: 5.5, us: 'I/9' });
    this.hookSizes.set('J/10', { mm: 6, us: 'J/10' });
    this.hookSizes.set('K/10.5', { mm: 6.5, us: 'K/10.5' });
    this.hookSizes.set('L/11', { mm: 8, us: 'L/11' });
    this.hookSizes.set('M/13', { mm: 9, us: 'M/13' });
    this.hookSizes.set('N/15', { mm: 10, us: 'N/15' });
    this.hookSizes.set('P/16', { mm: 11.5, us: 'P/16' });
    this.hookSizes.set('Q', { mm: 15, us: 'Q' });
    this.hookSizes.set('S', { mm: 19, us: 'S' });
  }
  
  initializeStitchConsumption() {
    // Yarn consumption per stitch in cm (for worsted weight as base)
    this.stitchConsumption.set('ch', 2.5);
    this.stitchConsumption.set('sl', 2.0);
    this.stitchConsumption.set('sc', 3.5);
    this.stitchConsumption.set('hdc', 4.5);
    this.stitchConsumption.set('dc', 5.5);
    this.stitchConsumption.set('tr', 7.0);
    this.stitchConsumption.set('dtr', 8.5);
    this.stitchConsumption.set('inc', 7.0); // Two sc
    this.stitchConsumption.set('dec', 3.0); // Slightly less than sc
    this.stitchConsumption.set('MR', 5.0);
    this.stitchConsumption.set('FO', 10.0); // Extra for weaving
    this.stitchConsumption.set('join', 3.0);
    this.stitchConsumption.set('turn', 0.5);
    this.stitchConsumption.set('picot', 4.0);
    this.stitchConsumption.set('popcorn', 15.0);
    this.stitchConsumption.set('bobble', 12.0);
    this.stitchConsumption.set('cluster', 10.0);
    this.stitchConsumption.set('shell', 20.0);
    this.stitchConsumption.set('v-stitch', 11.0);
  }
  
  initializeYarnDatabase() {
    // Common yarn brands and prices
    this.yarnDatabase.set('generic-acrylic', {
      name: 'Generic Acrylic',
      weight: 4,
      fiber: 'Acrylic',
      gramsPerSkein: 100,
      metersPerSkein: 190,
      pricePerSkein: 3.99,
      colors: ['white', 'black', 'red', 'blue', 'yellow', 'green']
    });
    
    this.yarnDatabase.set('premium-wool', {
      name: 'Premium Wool',
      weight: 4,
      fiber: 'Wool',
      gramsPerSkein: 100,
      metersPerSkein: 200,
      pricePerSkein: 12.99,
      colors: ['natural', 'dyed']
    });
    
    this.yarnDatabase.set('cotton-blend', {
      name: 'Cotton Blend',
      weight: 4,
      fiber: 'Cotton/Acrylic',
      gramsPerSkein: 100,
      metersPerSkein: 180,
      pricePerSkein: 5.99,
      colors: ['varied']
    });
    
    this.yarnDatabase.set('baby-yarn', {
      name: 'Baby Soft',
      weight: 3,
      fiber: 'Acrylic',
      gramsPerSkein: 100,
      metersPerSkein: 250,
      pricePerSkein: 4.99,
      colors: ['pastels']
    });
    
    this.yarnDatabase.set('chunky-wool', {
      name: 'Chunky Wool',
      weight: 5,
      fiber: 'Wool',
      gramsPerSkein: 100,
      metersPerSkein: 120,
      pricePerSkein: 9.99,
      colors: ['varied']
    });
  }
  
  initializeGaugeDefaults() {
    // Default gauge (stitches per 10cm) for each weight
    this.gaugeDefaults.set(0, { stitches: 30, rows: 40 });
    this.gaugeDefaults.set(1, { stitches: 25, rows: 35 });
    this.gaugeDefaults.set(2, { stitches: 20, rows: 28 });
    this.gaugeDefaults.set(3, { stitches: 18, rows: 24 });
    this.gaugeDefaults.set(4, { stitches: 16, rows: 20 });
    this.gaugeDefaults.set(5, { stitches: 12, rows: 16 });
    this.gaugeDefaults.set(6, { stitches: 8, rows: 12 });
    this.gaugeDefaults.set(7, { stitches: 5, rows: 8 });
  }
  
  // ==================== MAIN CALCULATIONS ====================
  
  calculateYarnRequirement(pattern, options = {}) {
    const {
      yarnWeight = 4,
      gauge = null,
      projectType = 'general',
      addWaste = true,
      wasteFactor = 0.1 // 10% waste
    } = options;
    
    // Calculate base consumption
    let totalConsumption = 0; // in cm
    
    for (const stitch of pattern) {
      const baseConsumption = this.stitchConsumption.get(stitch) || 3.5;
      const weightFactor = this.getWeightFactor(yarnWeight);
      totalConsumption += baseConsumption * weightFactor;
    }
    
    // Apply gauge adjustment if provided
    if (gauge) {
      const defaultGauge = this.gaugeDefaults.get(yarnWeight);
      if (defaultGauge) {
        const gaugeFactor = defaultGauge.stitches / gauge.stitches;
        totalConsumption *= gaugeFactor;
      }
    }
    
    // Add waste factor
    if (addWaste) {
      totalConsumption *= (1 + wasteFactor);
    }
    
    // Convert to standard measurements
    const meters = totalConsumption / 100;
    const yards = meters * 1.09361;
    const grams = this.metersToGrams(meters, yarnWeight);
    
    // Calculate skeins needed
    const yarnInfo = this.yarnWeights.get(yarnWeight);
    const metersPerSkein = yarnInfo?.meters100g || 190;
    const skeinsNeeded = Math.ceil(meters / metersPerSkein);
    
    return {
      pattern: {
        stitchCount: pattern.length,
        uniqueStitches: new Set(pattern).size
      },
      consumption: {
        centimeters: Math.round(totalConsumption),
        meters: Math.round(meters * 10) / 10,
        yards: Math.round(yards * 10) / 10,
        grams: Math.round(grams),
        ounces: Math.round(grams * 0.035274 * 10) / 10
      },
      skeins: {
        needed: skeinsNeeded,
        recommended: skeinsNeeded + 1, // Buy extra
        perSkein: {
          meters: metersPerSkein,
          grams: 100
        }
      },
      waste: {
        included: addWaste,
        percentage: wasteFactor * 100,
        meters: Math.round(meters * wasteFactor * 10) / 10
      }
    };
  }
  
  calculateProjectCost(yarnRequirement, yarnChoice = 'generic-acrylic', options = {}) {
    const {
      includeHook = true,
      includeNotions = true,
      includeTax = true,
      taxRate = 0.08,
      currency = this.currency
    } = options;
    
    const yarn = this.yarnDatabase.get(yarnChoice) || this.yarnDatabase.get('generic-acrylic');
    
    // Calculate yarn cost
    const yarnCost = yarnRequirement.skeins.recommended * yarn.pricePerSkein;
    
    // Calculate tool costs
    let toolCost = 0;
    if (includeHook) {
      toolCost += 5.99; // Average hook price
    }
    if (includeNotions) {
      toolCost += 8.99; // Needles, markers, scissors
    }
    
    // Calculate subtotal
    const subtotal = yarnCost + toolCost;
    
    // Calculate tax
    const tax = includeTax ? subtotal * taxRate : 0;
    
    // Calculate total
    const total = subtotal + tax;
    
    return {
      yarn: {
        type: yarn.name,
        skeins: yarnRequirement.skeins.recommended,
        pricePerSkein: yarn.pricePerSkein,
        total: Math.round(yarnCost * 100) / 100
      },
      tools: {
        hook: includeHook ? 5.99 : 0,
        notions: includeNotions ? 8.99 : 0,
        total: Math.round(toolCost * 100) / 100
      },
      summary: {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        currency
      },
      priceBreakdown: {
        yarnPercentage: ((yarnCost / total) * 100).toFixed(1),
        toolsPercentage: ((toolCost / total) * 100).toFixed(1),
        taxPercentage: ((tax / total) * 100).toFixed(1)
      }
    };
  }
  
  estimateProjectTime(pattern, options = {}) {
    const {
      skillLevel = 'intermediate',
      stitchesPerMinute = null,
      includeBreaks = true,
      sessionsPerDay = 1
    } = options;
    
    // Base speed by skill level (stitches per minute)
    const speedBySkill = {
      beginner: 15,
      intermediate: 25,
      advanced: 35,
      expert: 45
    };
    
    const baseSpeed = stitchesPerMinute || speedBySkill[skillLevel] || 25;
    
    // Calculate time for each stitch type
    let totalMinutes = 0;
    const timeFactors = {
      ch: 0.5,
      sl: 0.7,
      sc: 1.0,
      hdc: 1.2,
      dc: 1.3,
      tr: 1.5,
      inc: 1.8,
      dec: 1.5,
      MR: 2.0,
      popcorn: 3.0,
      bobble: 2.5,
      cluster: 2.0
    };
    
    for (const stitch of pattern) {
      const factor = timeFactors[stitch] || 1.0;
      totalMinutes += (1 / baseSpeed) * factor;
    }
    
    // Add time for starting, finishing, and weaving ends
    totalMinutes += 15; // Setup time
    totalMinutes += 30; // Finishing time
    
    // Add break time if included
    if (includeBreaks) {
      const workSessions = Math.ceil(totalMinutes / 60); // One break per hour
      totalMinutes += workSessions * 10; // 10 minute breaks
    }
    
    // Convert to useful units
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const days = Math.ceil(hours / (sessionsPerDay * 2)); // 2 hours per session
    
    return {
      total: {
        minutes: Math.round(totalMinutes),
        hours: hours,
        remainingMinutes: minutes,
        formatted: `${hours}h ${minutes}m`
      },
      perStitch: {
        average: (totalMinutes / pattern.length).toFixed(2),
        speed: baseSpeed
      },
      sessions: {
        count: Math.ceil(totalMinutes / 120), // 2 hour sessions
        perDay: sessionsPerDay,
        days: days
      },
      breakdown: {
        stitching: Math.round(totalMinutes - 45),
        setup: 15,
        finishing: 30,
        breaks: includeBreaks ? Math.ceil(totalMinutes / 60) * 10 : 0
      }
    };
  }
  
  compareYarnOptions(meters, options = {}) {
    const comparisons = [];
    
    for (const [key, yarn] of this.yarnDatabase) {
      const skeinsNeeded = Math.ceil(meters / yarn.metersPerSkein);
      const cost = skeinsNeeded * yarn.pricePerSkein;
      const costPerMeter = cost / meters;
      
      comparisons.push({
        id: key,
        name: yarn.name,
        fiber: yarn.fiber,
        weight: yarn.weight,
        skeinsNeeded,
        totalCost: Math.round(cost * 100) / 100,
        costPerMeter: Math.round(costPerMeter * 100) / 100,
        metersPerSkein: yarn.metersPerSkein,
        pricePerSkein: yarn.pricePerSkein
      });
    }
    
    // Sort by total cost
    comparisons.sort((a, b) => a.totalCost - b.totalCost);
    
    return {
      options: comparisons,
      cheapest: comparisons[0],
      mostExpensive: comparisons[comparisons.length - 1],
      recommendation: this.recommendYarn(comparisons, options)
    };
  }
  
  calculateSubstitution(originalYarn, originalAmount, newYarnWeight) {
    const originalWeight = this.yarnWeights.get(originalYarn.weight);
    const newWeight = this.yarnWeights.get(newYarnWeight);
    
    if (!originalWeight || !newWeight) {
      return { error: 'Invalid yarn weight' };
    }
    
    // Calculate length ratio
    const lengthRatio = originalWeight.meters100g / newWeight.meters100g;
    
    // Calculate new amount needed
    const newAmount = originalAmount * lengthRatio;
    
    // Calculate hook size adjustment
    const originalHook = (originalWeight.hookRange.min + originalWeight.hookRange.max) / 2;
    const newHook = (newWeight.hookRange.min + newWeight.hookRange.max) / 2;
    
    // Calculate gauge adjustment
    const gaugeRatio = originalWeight.gauge4inch.min / newWeight.gauge4inch.min;
    
    return {
      original: {
        weight: originalWeight.name,
        amount: originalAmount,
        hookSize: originalHook
      },
      substitution: {
        weight: newWeight.name,
        amount: Math.round(newAmount * 10) / 10,
        hookSize: newHook,
        adjustmentFactor: lengthRatio
      },
      adjustments: {
        hookSizeDifference: newHook - originalHook,
        gaugeRatio: Math.round(gaugeRatio * 100) / 100,
        stitchCountAdjustment: gaugeRatio > 1 ? 'increase' : 'decrease',
        notes: this.getSubstitutionNotes(originalYarn.weight, newYarnWeight)
      }
    };
  }
  
  // ==================== HELPER METHODS ====================
  
  getWeightFactor(yarnWeight) {
    // Adjustment factors for different yarn weights
    const factors = {
      0: 0.5,  // Lace
      1: 0.6,  // Super Fine
      2: 0.75, // Fine
      3: 0.85, // Light
      4: 1.0,  // Medium (base)
      5: 1.3,  // Bulky
      6: 1.6,  // Super Bulky
      7: 2.0   // Jumbo
    };
    
    return factors[yarnWeight] || 1.0;
  }
  
  metersToGrams(meters, yarnWeight) {
    const weight = this.yarnWeights.get(yarnWeight);
    if (!weight) return meters * 0.5; // Default estimate
    
    const gramsPerMeter = 100 / weight.meters100g;
    return meters * gramsPerMeter;
  }
  
  recommendYarn(comparisons, preferences = {}) {
    const {
      preferNatural = false,
      maxBudget = Infinity,
      preferredWeight = null
    } = preferences;
    
    let recommendations = [...comparisons];
    
    // Filter by budget
    recommendations = recommendations.filter(y => y.totalCost <= maxBudget);
    
    // Filter by weight if specified
    if (preferredWeight !== null) {
      recommendations = recommendations.filter(y => y.weight === preferredWeight);
    }
    
    // Score by preferences
    recommendations.forEach(yarn => {
      yarn.score = 0;
      
      // Price score (lower is better)
      yarn.score += (comparisons[0].totalCost / yarn.totalCost) * 30;
      
      // Fiber score
      if (preferNatural && yarn.fiber.includes('Wool')) {
        yarn.score += 20;
      } else if (!preferNatural && yarn.fiber.includes('Acrylic')) {
        yarn.score += 20;
      }
      
      // Value score (meters per dollar)
      const value = yarn.metersPerSkein / yarn.pricePerSkein;
      yarn.score += value * 10;
    });
    
    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);
    
    return recommendations[0] || comparisons[0];
  }
  
  getSubstitutionNotes(originalWeight, newWeight) {
    const notes = [];
    
    if (newWeight < originalWeight) {
      notes.push('Using thinner yarn - project will be more delicate');
      notes.push('Consider doubling the yarn for similar thickness');
      notes.push('May need to increase stitch count for same size');
    } else if (newWeight > originalWeight) {
      notes.push('Using thicker yarn - project will be sturdier');
      notes.push('May work up faster');
      notes.push('May need to decrease stitch count for same size');
    }
    
    if (Math.abs(newWeight - originalWeight) > 2) {
      notes.push('Significant weight difference - consider pattern adjustments');
      notes.push('Test gauge swatch strongly recommended');
    }
    
    return notes;
  }
  
  // ==================== EXPORT METHODS ====================
  
  exportCalculations(calculations) {
    return {
      timestamp: new Date().toISOString(),
      yarnRequirement: calculations.yarnRequirement,
      cost: calculations.cost,
      time: calculations.time,
      recommendations: calculations.recommendations
    };
  }
  
  generateShoppingList(calculations) {
    const list = {
      yarn: [],
      tools: [],
      notions: [],
      total: 0
    };
    
    if (calculations.yarnRequirement) {
      list.yarn.push({
        item: calculations.cost?.yarn.type || 'Yarn',
        quantity: calculations.yarnRequirement.skeins.recommended,
        unit: 'skeins',
        price: calculations.cost?.yarn.total || 0
      });
    }
    
    if (calculations.cost?.tools.hook > 0) {
      list.tools.push({
        item: 'Crochet Hook',
        quantity: 1,
        price: calculations.cost.tools.hook
      });
    }
    
    if (calculations.cost?.tools.notions > 0) {
      list.notions.push(
        { item: 'Yarn Needle', quantity: 1 },
        { item: 'Stitch Markers', quantity: 1 },
        { item: 'Scissors', quantity: 1 }
      );
    }
    
    list.total = calculations.cost?.summary.total || 0;
    
    return list;
  }
}

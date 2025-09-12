// src/utils/smartSuggestionsManager.js
// D11: AI-powered suggestions for assembly improvements

export class SmartSuggestionsManager {
  constructor() {
    this.suggestionCache = new Map();
    this.patterns = new Map();
    this.connectionHistory = [];
    this.pieceFrequency = new Map();
    this.suggestionTypes = new Set(['piece', 'connection', 'pattern', 'structural', 'optimization']);
    
    this.initializePatterns();
    this.initializeSuggestionRules();
  }
  
  initializePatterns() {
    // Common crochet patterns and their typical sequences
    this.patterns.set('amigurumi-body', {
      pieces: ['body', 'head', 'arms', 'legs'],
      connections: [
        { from: 'body', to: 'head', point: 'neck_joint' },
        { from: 'body', to: 'arms', point: 'shoulder' },
        { from: 'body', to: 'legs', point: 'hip' }
      ],
      stitchPattern: ['MR', 'sc', 'inc', 'sc', 'sc', 'inc']
    });
    
    this.patterns.set('granny-square', {
      pieces: ['center', 'round1', 'round2', 'round3'],
      connections: [
        { from: 'center', to: 'round1', point: 'edge' },
        { from: 'round1', to: 'round2', point: 'corner' }
      ],
      stitchPattern: ['ch', 'dc', 'ch', 'sl']
    });
    
    this.patterns.set('doily', {
      pieces: ['center-ring', 'petal', 'edge'],
      connections: [
        { from: 'center-ring', to: 'petal', point: 'loop', count: 8 },
        { from: 'petal', to: 'edge', point: 'tip' }
      ],
      stitchPattern: ['ch', 'sc', 'picot', 'sc']
    });
    
    this.patterns.set('scarf', {
      pieces: ['row', 'fringe'],
      connections: [
        { from: 'row', to: 'row', point: 'edge', repeat: true },
        { from: 'row', to: 'fringe', point: 'end', optional: true }
      ],
      stitchPattern: ['ch', 'sc', 'hdc', 'dc', 'hdc', 'sc']
    });
  }
  
  initializeSuggestionRules() {
    this.rules = {
      // Piece suggestion rules
      pieceSuggestions: [
        {
          condition: (assembly) => {
            const hasTorso = Array.from(assembly.pieces.values()).some(p => 
              p.type === 'body' || p.type === 'torso'
            );
            const hasHead = Array.from(assembly.pieces.values()).some(p => 
              p.type === 'head'
            );
            return hasTorso && !hasHead;
          },
          suggestion: {
            type: 'piece',
            priority: 'high',
            piece: { type: 'head', size: 'proportional' },
            reason: 'Body needs a head for complete figure'
          }
        },
        {
          condition: (assembly) => {
            const pieces = Array.from(assembly.pieces.values());
            return pieces.length === 1 && pieces[0].type === 'center';
          },
          suggestion: {
            type: 'piece',
            priority: 'medium',
            piece: { type: 'round', variant: 'expanding' },
            reason: 'Add rounds to expand from center'
          }
        },
        {
          condition: (assembly) => {
            const hasBody = Array.from(assembly.pieces.values()).some(p => 
              p.type === 'body'
            );
            const armCount = Array.from(assembly.pieces.values()).filter(p => 
              p.type === 'arm'
            ).length;
            return hasBody && armCount === 1;
          },
          suggestion: {
            type: 'piece',
            priority: 'high',
            piece: { type: 'arm', side: 'opposite' },
            reason: 'Add matching arm for symmetry'
          }
        }
      ],
      
      // Connection suggestion rules
      connectionSuggestions: [
        {
          condition: (piece1, piece2, assembly) => {
            return piece1.type === 'body' && piece2.type === 'head' &&
                   !this.areConnected(piece1.id, piece2.id, assembly);
          },
          suggestion: {
            type: 'connection',
            priority: 'high',
            from: { point: 'neck_joint' },
            to: { point: 'neck' },
            reason: 'Natural connection point for head and body'
          }
        },
        {
          condition: (piece1, piece2, assembly) => {
            const p1Connections = assembly.getConnectionsForPiece(piece1.id);
            const p2Connections = assembly.getConnectionsForPiece(piece2.id);
            return p1Connections.length === 0 || p2Connections.length === 0;
          },
          suggestion: {
            type: 'connection',
            priority: 'medium',
            from: { point: 'auto' },
            to: { point: 'auto' },
            reason: 'Connect unattached pieces to main assembly'
          }
        }
      ],
      
      // Pattern suggestion rules
      patternSuggestions: [
        {
          condition: (piece) => {
            const pattern = piece.metadata?.pattern || [];
            return pattern.length > 0 && pattern[0] !== 'MR' && 
                   piece.type === 'amigurumi';
          },
          suggestion: {
            type: 'pattern',
            priority: 'medium',
            modification: 'prepend',
            stitches: ['MR'],
            reason: 'Amigurumi typically starts with Magic Ring'
          }
        },
        {
          condition: (piece) => {
            const pattern = piece.metadata?.pattern || [];
            const incCount = pattern.filter(s => s === 'inc').length;
            const decCount = pattern.filter(s => s === 'dec').length;
            return incCount > decCount * 2;
          },
          suggestion: {
            type: 'pattern',
            priority: 'low',
            modification: 'balance',
            reason: 'Consider adding decreases for shaping'
          }
        }
      ],
      
      // Structural suggestions
      structuralSuggestions: [
        {
          condition: (assembly) => {
            const pieces = Array.from(assembly.pieces.values());
            const leftPieces = pieces.filter(p => p.metadata?.side === 'left');
            const rightPieces = pieces.filter(p => p.metadata?.side === 'right');
            return Math.abs(leftPieces.length - rightPieces.length) > 1;
          },
          suggestion: {
            type: 'structural',
            priority: 'medium',
            action: 'balance-sides',
            reason: 'Assembly appears asymmetrical'
          }
        },
        {
          condition: (assembly) => {
            return this.detectWeakPoints(assembly).length > 0;
          },
          suggestion: {
            type: 'structural',
            priority: 'high',
            action: 'reinforce',
            points: 'weak-connections',
            reason: 'Some connections may need reinforcement'
          }
        }
      ]
    };
  }
  
  // Main suggestion generation
  generateSuggestions(assembly, context = {}) {
    const cacheKey = `${assembly.id}_${assembly.version}_${JSON.stringify(context)}`;
    
    // Check cache
    if (this.suggestionCache.has(cacheKey)) {
      const cached = this.suggestionCache.get(cacheKey);
      if (cached.timestamp > Date.now() - 3000) { // 3 second cache
        return cached.suggestions;
      }
    }
    
    const suggestions = [];
    
    // Generate piece suggestions
    if (!context.type || context.type === 'piece') {
      suggestions.push(...this.generatePieceSuggestions(assembly));
    }
    
    // Generate connection suggestions
    if (!context.type || context.type === 'connection') {
      suggestions.push(...this.generateConnectionSuggestions(assembly));
    }
    
    // Generate pattern suggestions
    if (!context.type || context.type === 'pattern') {
      suggestions.push(...this.generatePatternSuggestions(assembly));
    }
    
    // Generate structural suggestions
    if (!context.type || context.type === 'structural') {
      suggestions.push(...this.generateStructuralSuggestions(assembly));
    }
    
    // Generate optimization suggestions
    if (!context.type || context.type === 'optimization') {
      suggestions.push(...this.generateOptimizationSuggestions(assembly));
    }
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    
    // Add confidence scores
    suggestions.forEach(s => {
      s.confidence = this.calculateConfidence(s, assembly);
      s.id = this.generateSuggestionId(s);
      s.timestamp = Date.now();
    });
    
    // Cache results
    this.suggestionCache.set(cacheKey, {
      timestamp: Date.now(),
      suggestions
    });
    
    return suggestions;
  }
  
  generatePieceSuggestions(assembly) {
    const suggestions = [];
    
    for (const rule of this.rules.pieceSuggestions) {
      if (rule.condition(assembly)) {
        const suggestion = { ...rule.suggestion };
        
        // Detect pattern if possible
        const detectedPattern = this.detectPattern(assembly);
        if (detectedPattern) {
          suggestion.patternContext = detectedPattern;
          suggestion.reason += ` (${detectedPattern} pattern detected)`;
        }
        
        // Add next piece in sequence if pattern detected
        if (detectedPattern && this.patterns.has(detectedPattern)) {
          const pattern = this.patterns.get(detectedPattern);
          const currentPieces = Array.from(assembly.pieces.values()).map(p => p.type);
          const nextPiece = pattern.pieces.find(p => !currentPieces.includes(p));
          
          if (nextPiece) {
            suggestion.piece = { 
              type: nextPiece, 
              pattern: pattern.stitchPattern 
            };
          }
        }
        
        suggestions.push(suggestion);
      }
    }
    
    // Learn from frequency
    const mostUsed = this.getMostFrequentPieceType();
    if (mostUsed && Math.random() > 0.7) { // 30% chance to suggest frequent piece
      suggestions.push({
        type: 'piece',
        priority: 'low',
        piece: { type: mostUsed },
        reason: 'Frequently used piece type',
        learned: true
      });
    }
    
    return suggestions;
  }
  
  generateConnectionSuggestions(assembly) {
    const suggestions = [];
    const pieces = Array.from(assembly.pieces.values());
    
    // Check each pair of pieces
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const piece1 = pieces[i];
        const piece2 = pieces[j];
        
        for (const rule of this.rules.connectionSuggestions) {
          if (rule.condition(piece1, piece2, assembly)) {
            const suggestion = { ...rule.suggestion };
            suggestion.pieces = [piece1.id, piece2.id];
            
            // Find best connection points
            const bestPoints = this.findBestConnectionPoints(piece1, piece2, assembly);
            if (bestPoints) {
              suggestion.from = { 
                piece: piece1.id, 
                point: bestPoints.point1 
              };
              suggestion.to = { 
                piece: piece2.id, 
                point: bestPoints.point2 
              };
              suggestion.distance = bestPoints.distance;
            }
            
            suggestions.push(suggestion);
          }
        }
      }
    }
    
    // Suggest connections based on history
    const historicalConnections = this.getHistoricalConnectionPatterns(assembly);
    suggestions.push(...historicalConnections);
    
    return suggestions;
  }
  
  generatePatternSuggestions(assembly) {
    const suggestions = [];
    
    for (const piece of assembly.pieces.values()) {
      for (const rule of this.rules.patternSuggestions) {
        if (rule.condition(piece)) {
          const suggestion = { ...rule.suggestion };
          suggestion.pieceId = piece.id;
          
          // Generate specific stitch recommendations
          if (suggestion.modification === 'balance') {
            const pattern = piece.metadata?.pattern || [];
            suggestion.recommendedPattern = this.balancePattern(pattern);
          }
          
          suggestions.push(suggestion);
        }
      }
    }
    
    // Suggest pattern consistency
    const inconsistencies = this.findPatternInconsistencies(assembly);
    for (const issue of inconsistencies) {
      suggestions.push({
        type: 'pattern',
        priority: 'low',
        pieceId: issue.pieceId,
        modification: 'align',
        targetPattern: issue.suggestedPattern,
        reason: 'Align pattern with similar pieces'
      });
    }
    
    return suggestions;
  }
  
  generateStructuralSuggestions(assembly) {
    const suggestions = [];
    
    for (const rule of this.rules.structuralSuggestions) {
      if (rule.condition(assembly)) {
        const suggestion = { ...rule.suggestion };
        
        // Add specific recommendations
        if (suggestion.action === 'reinforce') {
          suggestion.weakPoints = this.detectWeakPoints(assembly);
        } else if (suggestion.action === 'balance-sides') {
          suggestion.imbalance = this.calculateImbalance(assembly);
        }
        
        suggestions.push(suggestion);
      }
    }
    
    // Check structural integrity
    const integrity = this.analyzeStructuralIntegrity(assembly);
    if (integrity.score < 0.7) {
      suggestions.push({
        type: 'structural',
        priority: 'high',
        action: 'improve-stability',
        score: integrity.score,
        issues: integrity.issues,
        reason: 'Overall structural integrity could be improved'
      });
    }
    
    return suggestions;
  }
  
  generateOptimizationSuggestions(assembly) {
    const suggestions = [];
    
    // Suggest piece consolidation
    const consolidation = this.findConsolidationOpportunities(assembly);
    if (consolidation.length > 0) {
      suggestions.push({
        type: 'optimization',
        priority: 'low',
        action: 'consolidate',
        pieces: consolidation,
        reason: 'These pieces could be combined for simpler construction'
      });
    }
    
    // Suggest connection optimization
    const redundant = this.findRedundantConnections(assembly);
    if (redundant.length > 0) {
      suggestions.push({
        type: 'optimization',
        priority: 'low',
        action: 'remove-redundant',
        connections: redundant,
        reason: 'Some connections may be redundant'
      });
    }
    
    // Suggest pattern simplification
    const complex = this.findOverlyComplexPatterns(assembly);
    if (complex.length > 0) {
      suggestions.push({
        type: 'optimization',
        priority: 'low',
        action: 'simplify-pattern',
        pieces: complex,
        reason: 'Pattern complexity could be reduced'
      });
    }
    
    return suggestions;
  }
  
  // Helper methods
  detectPattern(assembly) {
    const pieces = Array.from(assembly.pieces.values());
    const pieceTypes = pieces.map(p => p.type);
    
    for (const [name, pattern] of this.patterns) {
      const matchCount = pattern.pieces.filter(p => 
        pieceTypes.includes(p)
      ).length;
      
      if (matchCount >= pattern.pieces.length * 0.5) {
        return name;
      }
    }
    
    return null;
  }
  
  areConnected(piece1Id, piece2Id, assembly) {
    const connections = assembly.connections || [];
    return Array.from(connections).some(c => 
      (c.fromPiece === piece1Id && c.toPiece === piece2Id) ||
      (c.fromPiece === piece2Id && c.toPiece === piece1Id)
    );
  }
  
  findBestConnectionPoints(piece1, piece2, assembly) {
    const points1 = Array.from(piece1.connectionPoints.entries());
    const points2 = Array.from(piece2.connectionPoints.entries());
    
    let bestMatch = null;
    let minDistance = Infinity;
    
    for (const [name1, point1] of points1) {
      for (const [name2, point2] of points2) {
        // Check if points are available
        const p1Used = this.isPointUsed(piece1.id, name1, assembly);
        const p2Used = this.isPointUsed(piece2.id, name2, assembly);
        
        if (!p1Used && !p2Used) {
          // Calculate distance (simplified)
          const distance = this.calculatePointDistance(
            point1.position, 
            point2.position
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            bestMatch = {
              point1: name1,
              point2: name2,
              distance
            };
          }
        }
      }
    }
    
    return bestMatch;
  }
  
  isPointUsed(pieceId, pointName, assembly) {
    const connections = assembly.getConnectionsForPiece?.(pieceId) || [];
    return connections.some(c => 
      (c.fromPiece === pieceId && c.fromPoint === pointName) ||
      (c.toPiece === pieceId && c.toPoint === pointName)
    );
  }
  
  calculatePointDistance(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  detectWeakPoints(assembly) {
    const weakPoints = [];
    
    for (const piece of assembly.pieces.values()) {
      const connections = assembly.getConnectionsForPiece(piece.id);
      
      // Single connection points are weak
      if (connections.length === 1) {
        weakPoints.push({
          pieceId: piece.id,
          type: 'single-connection',
          severity: 'medium'
        });
      }
      
      // Check for stress points
      if (connections.length > 4) {
        weakPoints.push({
          pieceId: piece.id,
          type: 'stress-point',
          severity: 'high'
        });
      }
    }
    
    return weakPoints;
  }
  
  calculateImbalance(assembly) {
    const pieces = Array.from(assembly.pieces.values());
    const leftCount = pieces.filter(p => p.metadata?.side === 'left').length;
    const rightCount = pieces.filter(p => p.metadata?.side === 'right').length;
    const centerCount = pieces.filter(p => !p.metadata?.side).length;
    
    return {
      left: leftCount,
      right: rightCount,
      center: centerCount,
      imbalanceScore: Math.abs(leftCount - rightCount) / (leftCount + rightCount + 1)
    };
  }
  
  analyzeStructuralIntegrity(assembly) {
    let score = 1.0;
    const issues = [];
    
    // Check for floating pieces
    if (this.hasFloatingPieces(assembly)) {
      score -= 0.3;
      issues.push('floating-pieces');
    }
    
    // Check connection distribution
    const avgConnections = assembly.connections.size / assembly.pieces.size;
    if (avgConnections < 1.5) {
      score -= 0.2;
      issues.push('sparse-connections');
    }
    
    // Check for weak points
    const weakPoints = this.detectWeakPoints(assembly);
    score -= weakPoints.length * 0.05;
    
    return { score: Math.max(0, score), issues };
  }
  
  hasFloatingPieces(assembly) {
    if (assembly.pieces.size <= 1) return false;
    
    const visited = new Set();
    const firstId = Array.from(assembly.pieces.keys())[0];
    this.traverse(firstId, assembly, visited);
    
    return visited.size !== assembly.pieces.size;
  }
  
  traverse(pieceId, assembly, visited) {
    visited.add(pieceId);
    const connections = assembly.getConnectionsForPiece(pieceId);
    
    for (const conn of connections) {
      const nextId = conn.fromPiece === pieceId ? conn.toPiece : conn.fromPiece;
      if (!visited.has(nextId)) {
        this.traverse(nextId, assembly, visited);
      }
    }
  }
  
  balancePattern(pattern) {
    const incCount = pattern.filter(s => s === 'inc').length;
    const decCount = pattern.filter(s => s === 'dec').length;
    
    if (incCount > decCount * 2) {
      // Add decreases
      const balanced = [...pattern];
      const decreasesNeeded = Math.floor((incCount - decCount) / 2);
      for (let i = 0; i < decreasesNeeded; i++) {
        balanced.push('dec');
      }
      return balanced;
    }
    
    return pattern;
  }
  
  findPatternInconsistencies(assembly) {
    const inconsistencies = [];
    const typePatterns = new Map();
    
    // Group patterns by piece type
    for (const piece of assembly.pieces.values()) {
      const type = piece.type;
      if (!typePatterns.has(type)) {
        typePatterns.set(type, []);
      }
      typePatterns.get(type).push({
        id: piece.id,
        pattern: piece.metadata?.pattern || []
      });
    }
    
    // Find inconsistencies within each type
    for (const [type, pieces] of typePatterns) {
      if (pieces.length > 1) {
        // Find most common pattern length
        const lengths = pieces.map(p => p.pattern.length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        
        for (const piece of pieces) {
          if (Math.abs(piece.pattern.length - avgLength) > 3) {
            inconsistencies.push({
              pieceId: piece.id,
              currentPattern: piece.pattern,
              suggestedPattern: pieces[0].pattern // Use first as reference
            });
          }
        }
      }
    }
    
    return inconsistencies;
  }
  
  findConsolidationOpportunities(assembly) {
    const opportunities = [];
    const pieces = Array.from(assembly.pieces.values());
    
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const p1 = pieces[i];
        const p2 = pieces[j];
        
        // Check if pieces are similar and connected
        if (p1.type === p2.type && this.areConnected(p1.id, p2.id, assembly)) {
          const p1Pattern = p1.metadata?.pattern || [];
          const p2Pattern = p2.metadata?.pattern || [];
          
          // Similar patterns can be consolidated
          if (Math.abs(p1Pattern.length - p2Pattern.length) <= 2) {
            opportunities.push([p1.id, p2.id]);
          }
        }
      }
    }
    
    return opportunities;
  }
  
  findRedundantConnections(assembly) {
    // This would analyze connection paths to find redundant connections
    // Simplified for this implementation
    return [];
  }
  
  findOverlyComplexPatterns(assembly) {
    const complex = [];
    
    for (const piece of assembly.pieces.values()) {
      const pattern = piece.metadata?.pattern || [];
      
      // Check for excessive pattern length
      if (pattern.length > 20) {
        complex.push({
          pieceId: piece.id,
          patternLength: pattern.length,
          complexity: 'high'
        });
      }
      
      // Check for too many different stitch types
      const uniqueStitches = new Set(pattern).size;
      if (uniqueStitches > 6) {
        complex.push({
          pieceId: piece.id,
          uniqueStitches,
          complexity: 'varied'
        });
      }
    }
    
    return complex;
  }
  
  getHistoricalConnectionPatterns(assembly) {
    const suggestions = [];
    
    // Analyze connection history for patterns
    for (const conn of this.connectionHistory) {
      const similar = Array.from(assembly.pieces.values()).filter(p => 
        p.type === conn.fromType || p.type === conn.toType
      );
      
      if (similar.length >= 2) {
        suggestions.push({
          type: 'connection',
          priority: 'low',
          from: { piece: similar[0].id, point: conn.fromPoint },
          to: { piece: similar[1].id, point: conn.toPoint },
          reason: 'Based on historical connection patterns',
          learned: true
        });
      }
    }
    
    return suggestions.slice(0, 3); // Limit to top 3
  }
  
  getMostFrequentPieceType() {
    let maxCount = 0;
    let mostFrequent = null;
    
    for (const [type, count] of this.pieceFrequency) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = type;
      }
    }
    
    return mostFrequent;
  }
  
  calculateConfidence(suggestion, assembly) {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for high priority
    if (suggestion.priority === 'high') confidence += 0.2;
    if (suggestion.priority === 'medium') confidence += 0.1;
    
    // Higher confidence if pattern detected
    if (suggestion.patternContext) confidence += 0.15;
    
    // Higher confidence if learned from history
    if (suggestion.learned) confidence += 0.1;
    
    // Lower confidence for large assemblies (more complex)
    if (assembly.pieces.size > 20) confidence -= 0.1;
    
    return Math.min(Math.max(confidence, 0), 1);
  }
  
  generateSuggestionId(suggestion) {
    const timestamp = Date.now();
    const type = suggestion.type;
    const random = Math.random().toString(36).substr(2, 5);
    return `${type}-${timestamp}-${random}`;
  }
  
  // Learning methods
  recordConnection(fromPiece, fromPoint, toPiece, toPoint) {
    this.connectionHistory.push({
      fromType: fromPiece.type,
      fromPoint,
      toType: toPiece.type,
      toPoint,
      timestamp: Date.now()
    });
    
    // Keep only last 100 connections
    if (this.connectionHistory.length > 100) {
      this.connectionHistory.shift();
    }
  }
  
  recordPieceUsage(pieceType) {
    const current = this.pieceFrequency.get(pieceType) || 0;
    this.pieceFrequency.set(pieceType, current + 1);
  }
  
  // Export suggestions
  exportSuggestions(suggestions) {
    return {
      timestamp: new Date().toISOString(),
      count: suggestions.length,
      byType: {
        piece: suggestions.filter(s => s.type === 'piece').length,
        connection: suggestions.filter(s => s.type === 'connection').length,
        pattern: suggestions.filter(s => s.type === 'pattern').length,
        structural: suggestions.filter(s => s.type === 'structural').length,
        optimization: suggestions.filter(s => s.type === 'optimization').length
      },
      suggestions: suggestions.map(s => ({
        id: s.id,
        type: s.type,
        priority: s.priority,
        confidence: s.confidence,
        reason: s.reason,
        details: s
      }))
    };
  }
}

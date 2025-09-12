// src/utils/assemblyValidationManager.js
// D10: Comprehensive assembly validation system

export class AssemblyValidationManager {
  constructor() {
    this.rules = new Map();
    this.validators = new Map();
    this.validationCache = new Map();
    this.structuralChecks = new Set();
    
    this.initializeDefaultRules();
    this.initializeValidators();
  }
  
  initializeDefaultRules() {
    // Connection rules
    this.addRule('no-self-connection', {
      type: 'connection',
      severity: 'error',
      check: (piece1, point1, piece2, point2) => {
        return piece1.id !== piece2.id;
      },
      message: 'Cannot connect a piece to itself'
    });
    
    this.addRule('valid-connection-points', {
      type: 'connection',
      severity: 'error',
      check: (piece1, point1, piece2, point2) => {
        return piece1.connectionPoints.has(point1) && 
               piece2.connectionPoints.has(point2);
      },
      message: 'Invalid connection points specified'
    });
    
    this.addRule('point-not-occupied', {
      type: 'connection',
      severity: 'error',
      check: (piece1, point1, piece2, point2, assembly) => {
        const p1Connections = assembly.getConnectionsForPiece(piece1.id);
        const p2Connections = assembly.getConnectionsForPiece(piece2.id);
        
        const p1Occupied = p1Connections.some(c => 
          c.fromPoint === point1 || c.toPoint === point1
        );
        const p2Occupied = p2Connections.some(c => 
          c.fromPoint === point2 || c.toPoint === point2
        );
        
        return !p1Occupied && !p2Occupied;
      },
      message: 'Connection point already occupied'
    });
    
    this.addRule('compatible-types', {
      type: 'connection',
      severity: 'warning',
      check: (piece1, point1, piece2, point2) => {
        const type1 = piece1.connectionPoints.get(point1)?.type;
        const type2 = piece2.connectionPoints.get(point2)?.type;
        
        // Define compatibility matrix
        const compatible = {
          'standard': ['standard', 'flexible'],
          'flexible': ['standard', 'flexible', 'rigid'],
          'rigid': ['flexible', 'rigid'],
          'special': ['special']
        };
        
        return compatible[type1]?.includes(type2) || false;
      },
      message: 'Connection types may not be compatible'
    });
    
    // Structural rules
    this.addRule('max-connections-per-piece', {
      type: 'structural',
      severity: 'warning',
      check: (piece, assembly) => {
        const connections = assembly.getConnectionsForPiece(piece.id);
        const maxConnections = piece.metadata?.maxConnections || 8;
        return connections.length <= maxConnections;
      },
      message: 'Piece has reached maximum connections'
    });
    
    this.addRule('no-floating-pieces', {
      type: 'structural',
      severity: 'error',
      check: (assembly) => {
        // Check if all pieces are connected (except first piece)
        if (assembly.pieces.size <= 1) return true;
        
        const visited = new Set();
        const firstPieceId = Array.from(assembly.pieces.keys())[0];
        
        this.traverseConnections(firstPieceId, assembly, visited);
        
        return visited.size === assembly.pieces.size;
      },
      message: 'Assembly contains disconnected pieces'
    });
    
    this.addRule('no-cycles', {
      type: 'structural',
      severity: 'info',
      check: (assembly) => {
        // Detect cycles in the connection graph
        const visited = new Set();
        const recursionStack = new Set();
        
        for (const pieceId of assembly.pieces.keys()) {
          if (!visited.has(pieceId)) {
            if (this.hasCycle(pieceId, assembly, visited, recursionStack)) {
              return false;
            }
          }
        }
        return true;
      },
      message: 'Assembly contains circular connections'
    });
    
    // Pattern rules
    this.addRule('valid-stitch-sequence', {
      type: 'pattern',
      severity: 'warning',
      check: (piece) => {
        const validStitches = ['sc', 'dc', 'hdc', 'tr', 'inc', 'dec', 'ch', 'sl'];
        const pattern = piece.metadata?.pattern || [];
        
        return pattern.every(stitch => 
          validStitches.includes(stitch.type || stitch)
        );
      },
      message: 'Invalid stitch type in pattern'
    });
    
    this.addRule('pattern-symmetry', {
      type: 'pattern',
      severity: 'info',
      check: (assembly) => {
        // Check if similar pieces have similar patterns
        const patternGroups = new Map();
        
        for (const piece of assembly.pieces.values()) {
          const type = piece.type;
          if (!patternGroups.has(type)) {
            patternGroups.set(type, []);
          }
          patternGroups.get(type).push(piece.metadata?.pattern?.length || 0);
        }
        
        // Check variance within groups
        for (const [type, lengths] of patternGroups) {
          if (lengths.length > 1) {
            const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
            const variance = lengths.reduce((sum, len) => 
              sum + Math.pow(len - avg, 2), 0
            ) / lengths.length;
            
            if (variance > 100) return false; // High variance indicates asymmetry
          }
        }
        
        return true;
      },
      message: 'Pattern asymmetry detected between similar pieces'
    });
    
    // Tier-specific rules
    this.addRule('tier-piece-limit', {
      type: 'tier',
      severity: 'error',
      check: (assembly, tier) => {
        const limits = {
          freemium: 10,
          pro: 25,
          studio: 50
        };
        
        return assembly.pieces.size <= (limits[tier] || 10);
      },
      message: 'Piece limit exceeded for current tier'
    });
    
    this.addRule('tier-complexity-limit', {
      type: 'tier',
      severity: 'warning',
      check: (assembly, tier) => {
        const complexityScore = this.calculateComplexity(assembly);
        const limits = {
          freemium: 50,
          pro: 200,
          studio: Infinity
        };
        
        return complexityScore <= (limits[tier] || 50);
      },
      message: 'Assembly complexity exceeds tier limit'
    });
  }
  
  initializeValidators() {
    // Connection validator
    this.validators.set('connection', (piece1, point1, piece2, point2, assembly) => {
      const results = [];
      
      for (const [name, rule] of this.rules) {
        if (rule.type !== 'connection') continue;
        
        const valid = rule.check(piece1, point1, piece2, point2, assembly);
        if (!valid) {
          results.push({
            rule: name,
            severity: rule.severity,
            message: rule.message,
            context: {
              piece1: piece1.id,
              point1,
              piece2: piece2.id,
              point2
            }
          });
        }
      }
      
      return results;
    });
    
    // Piece validator
    this.validators.set('piece', (piece, assembly) => {
      const results = [];
      
      for (const [name, rule] of this.rules) {
        if (rule.type !== 'structural' && rule.type !== 'pattern') continue;
        
        if (rule.check.length === 1) {
          // Rule checks single piece
          const valid = rule.check(piece);
          if (!valid) {
            results.push({
              rule: name,
              severity: rule.severity,
              message: rule.message,
              context: { piece: piece.id }
            });
          }
        } else if (rule.check.length === 2) {
          // Rule checks piece in context of assembly
          const valid = rule.check(piece, assembly);
          if (!valid) {
            results.push({
              rule: name,
              severity: rule.severity,
              message: rule.message,
              context: { piece: piece.id }
            });
          }
        }
      }
      
      return results;
    });
    
    // Assembly validator
    this.validators.set('assembly', (assembly, tier = 'freemium') => {
      const results = [];
      
      for (const [name, rule] of this.rules) {
        if (rule.type !== 'structural' && rule.type !== 'tier') continue;
        
        let valid;
        if (rule.type === 'tier') {
          valid = rule.check(assembly, tier);
        } else if (rule.check.length === 1) {
          valid = rule.check(assembly);
        } else {
          continue; // Skip rules that need specific context
        }
        
        if (!valid) {
          results.push({
            rule: name,
            severity: rule.severity,
            message: rule.message,
            context: { 
              pieceCount: assembly.pieces.size,
              connectionCount: assembly.connections.size 
            }
          });
        }
      }
      
      return results;
    });
  }
  
  // Validation methods
  validateConnection(piece1Id, point1, piece2Id, point2, assembly) {
    const piece1 = assembly.pieces.get(piece1Id);
    const piece2 = assembly.pieces.get(piece2Id);
    
    if (!piece1 || !piece2) {
      return {
        valid: false,
        errors: [{ 
          severity: 'error', 
          message: 'Piece not found in assembly' 
        }]
      };
    }
    
    const validator = this.validators.get('connection');
    const issues = validator(piece1, point1, piece2, point2, assembly);
    
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    const info = issues.filter(i => i.severity === 'info');
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      summary: this.generateSummary(issues)
    };
  }
  
  validatePiece(pieceId, assembly) {
    const piece = assembly.pieces.get(pieceId);
    if (!piece) {
      return {
        valid: false,
        errors: [{ 
          severity: 'error', 
          message: 'Piece not found' 
        }]
      };
    }
    
    const validator = this.validators.get('piece');
    const issues = validator(piece, assembly);
    
    return this.formatValidationResult(issues);
  }
  
  validateAssembly(assembly, tier = 'freemium') {
    const cacheKey = `${assembly.id}_${assembly.version}_${tier}`;
    
    // Check cache
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      if (cached.timestamp > Date.now() - 5000) { // 5 second cache
        return cached.result;
      }
    }
    
    const validator = this.validators.get('assembly');
    const issues = validator(assembly, tier);
    
    // Validate each piece
    for (const pieceId of assembly.pieces.keys()) {
      const pieceValidation = this.validatePiece(pieceId, assembly);
      issues.push(...pieceValidation.errors, ...pieceValidation.warnings);
    }
    
    const result = this.formatValidationResult(issues);
    
    // Cache result
    this.validationCache.set(cacheKey, {
      timestamp: Date.now(),
      result
    });
    
    return result;
  }
  
  // Rule management
  addRule(name, rule) {
    this.rules.set(name, rule);
  }
  
  removeRule(name) {
    return this.rules.delete(name);
  }
  
  setRuleSeverity(name, severity) {
    const rule = this.rules.get(name);
    if (rule) {
      rule.severity = severity;
      return true;
    }
    return false;
  }
  
  enableRule(name) {
    const rule = this.rules.get(name);
    if (rule) {
      rule.enabled = true;
      return true;
    }
    return false;
  }
  
  disableRule(name) {
    const rule = this.rules.get(name);
    if (rule) {
      rule.enabled = false;
      return true;
    }
    return false;
  }
  
  // Helper methods
  traverseConnections(pieceId, assembly, visited) {
    visited.add(pieceId);
    const connections = assembly.getConnectionsForPiece(pieceId);
    
    for (const conn of connections) {
      const nextId = conn.fromPiece === pieceId ? conn.toPiece : conn.fromPiece;
      if (!visited.has(nextId)) {
        this.traverseConnections(nextId, assembly, visited);
      }
    }
  }
  
  hasCycle(pieceId, assembly, visited, recursionStack) {
    visited.add(pieceId);
    recursionStack.add(pieceId);
    
    const connections = assembly.getConnectionsForPiece(pieceId);
    
    for (const conn of connections) {
      const nextId = conn.fromPiece === pieceId ? conn.toPiece : conn.fromPiece;
      
      if (!visited.has(nextId)) {
        if (this.hasCycle(nextId, assembly, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(nextId)) {
        return true;
      }
    }
    
    recursionStack.delete(pieceId);
    return false;
  }
  
  calculateComplexity(assembly) {
    let score = 0;
    
    // Base score from piece count
    score += assembly.pieces.size * 10;
    
    // Connection complexity
    score += assembly.connections.size * 5;
    
    // Pattern complexity
    for (const piece of assembly.pieces.values()) {
      const pattern = piece.metadata?.pattern || [];
      score += pattern.length * 2;
      
      // Extra points for complex stitches
      const complexStitches = pattern.filter(s => 
        ['tr', 'dtr', 'cluster', 'popcorn'].includes(s.type || s)
      );
      score += complexStitches.length * 5;
    }
    
    // Structural complexity
    const avgConnections = assembly.connections.size / assembly.pieces.size;
    if (avgConnections > 3) score += 20;
    if (avgConnections > 5) score += 30;
    
    return score;
  }
  
  formatValidationResult(issues) {
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    const info = issues.filter(i => i.severity === 'info');
    
    return {
      valid: errors.length === 0,
      score: this.calculateValidationScore(issues),
      errors,
      warnings,
      info,
      summary: this.generateSummary(issues),
      timestamp: Date.now()
    };
  }
  
  calculateValidationScore(issues) {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'error':
          score -= 20;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 1;
          break;
      }
    }
    
    return Math.max(0, score);
  }
  
  generateSummary(issues) {
    if (issues.length === 0) {
      return 'Assembly validation passed';
    }
    
    const errors = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    
    if (errors > 0) {
      return `Validation failed: ${errors} error(s), ${warnings} warning(s)`;
    } else if (warnings > 0) {
      return `Validation passed with ${warnings} warning(s)`;
    }
    
    return 'Validation passed with minor issues';
  }
  
  // Export validation report
  exportReport(assembly, tier = 'freemium') {
    const validation = this.validateAssembly(assembly, tier);
    
    return {
      timestamp: new Date().toISOString(),
      assemblyId: assembly.id,
      tier,
      pieceCount: assembly.pieces.size,
      connectionCount: assembly.connections.size,
      complexityScore: this.calculateComplexity(assembly),
      validation,
      rules: Array.from(this.rules.entries()).map(([name, rule]) => ({
        name,
        type: rule.type,
        severity: rule.severity,
        enabled: rule.enabled !== false
      }))
    };
  }
}

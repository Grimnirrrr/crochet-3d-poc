// src/utils/assemblyValidator.js

/**
 * Assembly Invariant Checker
 * Validates connection rules and assembly constraints
 */

/**
 * Check if two connection points are compatible
 */
export function arePointsCompatible(point1, point2) {
  if (!point1 || !point2) {
    console.warn('Missing connection points');
    return false;
  }
  
  // Check if types are compatible
  if (!point1.compatible || !point2.compatible) {
    return false;
  }
  
  // Check bidirectional compatibility
  const point1AcceptsPoint2 = point1.compatible.includes(point2.name) || 
                              point1.compatible.includes(point2.type) ||
                              point1.compatible.includes('any');
                              
  const point2AcceptsPoint1 = point2.compatible.includes(point1.name) || 
                              point2.compatible.includes(point1.type) ||
                              point2.compatible.includes('any');
  
  return point1AcceptsPoint2 && point2AcceptsPoint1;
}

/**
 * Check if a connection is valid
 */
export function isValidConnection(from, to, pieces) {
  console.log('Validating connection:', { from, to });
  
  // Rule 1: Points must exist
  if (!from || !to) {
    console.error('Connection validation failed: Missing points');
    return { valid: false, reason: 'Missing connection points' };
  }
  
  // Rule 2: Cannot connect to self (same piece)
  if (from.pieceId === to.pieceId) {
    console.warn('Cannot connect piece to itself');
    return { valid: false, reason: 'Cannot connect piece to itself' };
  }
  
  // Rule 3: Points must not be already occupied
  if (from.isOccupied) {
    console.warn(`Point ${from.name} is already occupied`);
    return { valid: false, reason: `${from.name} is already connected` };
  }
  
  if (to.isOccupied) {
    console.warn(`Point ${to.name} is already occupied`);
    return { valid: false, reason: `${to.name} is already connected` };
  }
  
  // Rule 4: Points must be compatible
  if (!arePointsCompatible(from, to)) {
    console.warn(`Points ${from.name} and ${to.name} are not compatible`);
    return { 
      valid: false, 
      reason: `${from.name} cannot connect to ${to.name} - incompatible types` 
    };
  }
  
  // Rule 5: Check for size compatibility (optional)
  if (from.size && to.size) {
    const sizeDiff = Math.abs(from.size - to.size);
    if (sizeDiff > 2) {
      console.warn('Size mismatch too large');
      return { 
        valid: false, 
        reason: 'Size difference too large - pieces won\'t fit well' 
      };
    }
  }
  
  // Rule 6: Check for logical assembly order (optional)
  if (from.assemblyOrder && to.assemblyOrder) {
    if (from.assemblyOrder > to.assemblyOrder) {
      console.info('Warning: Connecting in unusual order');
      // Just a warning, not blocking
    }
  }
  
  // All checks passed
  console.log('Connection is valid');
  return { valid: true, reason: 'Connection allowed' };
}

/**
 * Validate an entire assembly for consistency
 */
export function validateAssembly(assembly) {
  const issues = [];
  
  if (!assembly) {
    return { valid: false, issues: ['No assembly provided'] };
  }
  
  // Check 1: All connections are valid
  if (assembly.connections) {
    assembly.connections.forEach((conn, index) => {
      const piece1 = assembly.pieces?.get(conn.piece1Id);
      const piece2 = assembly.pieces?.get(conn.piece2Id);
      
      if (!piece1 || !piece2) {
        issues.push(`Connection ${index}: Missing pieces`);
        return;
      }
      
      const point1 = piece1.connectionPoints?.find(p => p.id === conn.point1Id);
      const point2 = piece2.connectionPoints?.find(p => p.id === conn.point2Id);
      
      const validation = isValidConnection(point1, point2, assembly.pieces);
      if (!validation.valid) {
        issues.push(`Connection ${index}: ${validation.reason}`);
      }
    });
  }
  
  // Check 2: No orphaned pieces (all pieces connected unless it's the first)
  if (assembly.pieces && assembly.pieces.size > 1) {
    const connectedPieces = new Set();
    
    assembly.connections?.forEach(conn => {
      connectedPieces.add(conn.piece1Id);
      connectedPieces.add(conn.piece2Id);
    });
    
    assembly.pieces.forEach((piece, id) => {
      if (!connectedPieces.has(id) && assembly.pieces.size > 1) {
        issues.push(`Piece "${piece.name}" is not connected to anything`);
      }
    });
  }
  
  // Check 3: No circular dependencies
  if (hasCircularDependency(assembly)) {
    issues.push('Assembly has circular dependencies');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Check for circular dependencies in assembly
 */
function hasCircularDependency(assembly) {
  if (!assembly.connections || assembly.connections.length === 0) {
    return false;
  }
  
  const graph = new Map();
  
  // Build adjacency list
  assembly.connections.forEach(conn => {
    if (!graph.has(conn.piece1Id)) {
      graph.set(conn.piece1Id, []);
    }
    if (!graph.has(conn.piece2Id)) {
      graph.set(conn.piece2Id, []);
    }
    graph.get(conn.piece1Id).push(conn.piece2Id);
    graph.get(conn.piece2Id).push(conn.piece1Id);
  });
  
  // DFS to detect cycles
  const visited = new Set();
  const recursionStack = new Set();
  
  function hasCycle(node, parent = null) {
    visited.add(node);
    recursionStack.add(node);
    
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (neighbor === parent) continue; // Skip parent in undirected graph
      
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor, node)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Suggest valid connection points for a piece
 */
export function suggestConnections(piece, allPieces) {
  const suggestions = [];
  
  if (!piece || !piece.connectionPoints) {
    return suggestions;
  }
  
  // Find all available connection points from other pieces
  allPieces.forEach((otherPiece, otherPieceId) => {
    if (otherPieceId === piece.id) return; // Skip self
    
    otherPiece.connectionPoints?.forEach(otherPoint => {
      if (otherPoint.isOccupied) return; // Skip occupied points
      
      // Check each of our points against this other point
      piece.connectionPoints.forEach(ourPoint => {
        if (ourPoint.isOccupied) return; // Skip our occupied points
        
        if (arePointsCompatible(ourPoint, otherPoint)) {
          suggestions.push({
            fromPoint: ourPoint,
            toPoint: otherPoint,
            toPiece: otherPiece,
            confidence: calculateConfidence(ourPoint, otherPoint)
          });
        }
      });
    });
  });
  
  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);
  
  return suggestions;
}

/**
 * Calculate confidence score for a connection
 */
function calculateConfidence(point1, point2) {
  let confidence = 0.5; // Base confidence
  
  // Exact name match is highest confidence
  if (point1.name === point2.compatible[0] || point2.name === point1.compatible[0]) {
    confidence = 1.0;
  }
  
  // Type match is good confidence
  else if (point1.type && point2.type && point1.compatible.includes(point2.type)) {
    confidence = 0.8;
  }
  
  // Size similarity affects confidence
  if (point1.size && point2.size) {
    const sizeDiff = Math.abs(point1.size - point2.size);
    confidence *= (1 - sizeDiff * 0.1); // Reduce confidence by size difference
  }
  
  return Math.max(0, Math.min(1, confidence)); // Clamp between 0 and 1
}
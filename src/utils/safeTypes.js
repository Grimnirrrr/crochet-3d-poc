// src/utils/safeTypes.js

/**
 * Safe Vector3 - prevents Three.js objects in data
 * Only stores plain {x, y, z} objects
 */
export function toSafeVector3(vector) {
  if (!vector) return null;
  
  // If it's a Three.js Vector3, extract values
  if (vector.isVector3) {
    return {
      x: vector.x,
      y: vector.y,
      z: vector.z,
      __safe: 'SafeVector3'
    };
  }
  
  // If it's already safe, return as-is
  if (vector.__safe === 'SafeVector3') {
    return vector;
  }
  
  // Convert plain object
  return {
    x: vector.x || 0,
    y: vector.y || 0,
    z: vector.z || 0,
    __safe: 'SafeVector3'
  };
}

/**
 * Safe Color - ensures only hex strings
 */
export function toSafeColor(color) {
  if (typeof color === 'string' && color.startsWith('#')) {
    return color;
  }
  
  // Convert Three.js Color to hex
  if (color && color.isColor) {
    return '#' + color.getHexString();
  }
  
  // Default color
  return '#fbbf24';
}

/**
 * Validate safe object before saving
 */
export function isSafeObject(obj) {
  // Check for Three.js objects
  const unsafeKeys = [
    'isObject3D', 'isGeometry', 'isMaterial', 
    'isBufferGeometry', 'isScene', 'isCamera'
  ];
  
  function checkObject(item) {
    if (!item || typeof item !== 'object') return true;
    
    // Check for unsafe properties
    for (let key of unsafeKeys) {
      if (key in item) {
        console.error(`Found unsafe Three.js property: ${key}`);
        return false;
      }
    }
    
    // Check nested objects
    for (let value of Object.values(item)) {
      if (typeof value === 'object' && !checkObject(value)) {
        return false;
      }
    }
    
    return true;
  }
  
  return checkObject(obj);
}

/**
 * Create safe piece data (no Three.js references)
 */
export function createSafePieceData(piece) {
  return {
    id: piece.id,
    name: piece.name,
    type: piece.type,
    color: toSafeColor(piece.color),
    connectionPoints: piece.connectionPoints?.map(point => ({
      id: point.id,
      name: point.name,
      position: toSafeVector3(point.position),
      compatible: [...(point.compatible || [])],
      isOccupied: !!point.isOccupied
    })),
    metadata: {
      stitchCount: piece.metadata?.stitchCount || 0,
      roundCount: piece.metadata?.roundCount || 0,
      createdAt: piece.metadata?.createdAt || Date.now()
    },
    __safe: 'SafePiece'
  };
}
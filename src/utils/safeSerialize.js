// src/utils/safeSerialize.js
import { containsThreeJS, stripThreeJS, sanitizeForStorage } from './sanitizer';

/**
 * Whitelist of allowed keys that can be saved
 * These are all primitive types or simple objects
 */
const ALLOWED_KEYS = [
  // Piece data
  'id', 'name', 'type', 'color', '__safe',
  
  // Position data (safe vectors)
  'x', 'y', 'z',
  
  // Connection data
  'position', 'normal', 'compatible', 'isOccupied',
  'connectedTo', 'pieceId', 'connectionId',
  
  // Metadata
  'stitchCount', 'roundCount', 'createdAt', 'lastModified',
  'version', 'projectId',
  
  // Pattern data
  'rounds', 'instruction', 'stitches', 'hasIncrease', 'hasDecrease',
  
  // Assembly data
  'pieces', 'connections', 'history', 'locked',
  'action', 'data', 'timestamp',
  
  // Tier system
  'currentTier', 'extraPiecesUsed', 'tierLimits',
  
  // Arrays and objects (will be recursively checked)
  'connectionPoints', 'metadata', 'pattern', 'assembly'
];

/**
 * Deep clean an object, removing any non-whitelisted keys
 */
export function cleanObject(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) {
    console.warn('Max depth reached in cleanObject');
    return null;
  }
  
  // Handle primitives
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item, depth + 1)).filter(item => item !== null);
  }
  
  // Handle objects
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip non-whitelisted keys
    if (!ALLOWED_KEYS.includes(key)) {
      console.log(`Skipping non-whitelisted key: ${key}`);
      continue;
    }
    
    // Check for Three.js objects
    if (value && typeof value === 'object') {
      if (value.isObject3D || value.isGeometry || value.isMaterial) {
        console.warn(`Blocked Three.js object at key: ${key}`);
        continue;
      }
    }
    
    // Recursively clean nested objects
    cleaned[key] = cleanObject(value, depth + 1);
  }
  
  return cleaned;
}

/**
 * Safe JSON stringify that removes non-whitelisted keys
 */
export function safeStringify(data) {
  try {
    const cleaned = cleanObject(data);
    return JSON.stringify(cleaned, null, 2);
  } catch (error) {
    console.error('Failed to stringify:', error);
    return null;
  }
}

/**
 * Safe JSON parse with validation
 */
export function safeParse(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    // Clean it again to ensure no tampering
    return cleanObject(parsed);
  } catch (error) {
    console.error('Failed to parse:', error);
    return null;
  }
}

/**
 * Safe localStorage setter - UPDATED VERSION WITH SANITIZER
 */
export function safeLocalStorageSet(key, data) {
  // First run through sanitizer
  const sanitized = sanitizeForStorage(data, key);
  if (!sanitized) {
    console.error(`Data for ${key} failed sanitization`);
    return false;
  }
  
  // Then clean with whitelist
  const cleaned = cleanObject(sanitized);
  const stringified = safeStringify(cleaned);
  
  if (stringified) {
    try {
      localStorage.setItem(key, stringified);
      console.log(`Saved to localStorage[${key}]:`, cleaned);
      return true;
    } catch (error) {
      console.error('localStorage.setItem failed:', error);
      return false;
    }
  }
  return false;
}

/**
 * Safe localStorage getter
 */
export function safeLocalStorageGet(key) {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return safeParse(item);
    }
  } catch (error) {
    console.error('localStorage.getItem failed:', error);
  }
  return null;
}

/**
 * Validate that an object contains no Three.js references
 */
export function validateNoThreeJS(obj) {
  const suspicious = [
    'scene', 'camera', 'renderer', 'geometry', 'material',
    'mesh', 'group', 'isObject3D', 'isGeometry', 'isMaterial',
    'dispose', 'render', 'animate', 'requestAnimationFrame'
  ];
  
  function check(item, path = '') {
    if (!item || typeof item !== 'object') return true;
    
    for (const [key, value] of Object.entries(item)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check for suspicious keys
      if (suspicious.includes(key)) {
        console.error(`Found suspicious Three.js key at ${currentPath}`);
        return false;
      }
      
      // Check for Three.js object properties
      if (value && typeof value === 'object') {
        if (value.isObject3D || value.isGeometry || value.isMaterial) {
          console.error(`Found Three.js object at ${currentPath}`);
          return false;
        }
        
        // Recursively check nested objects
        if (!check(value, currentPath)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  return check(obj);
}

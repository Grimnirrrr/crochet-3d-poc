// src/utils/sanitizer.js

/**
 * Deep check for Three.js objects and other non-serializable items
 * This is our last line of defense before saving
 */

// List of Three.js property signatures to detect
const THREE_JS_SIGNATURES = [
  'isObject3D',
  'isGeometry',
  'isBufferGeometry',
  'isMaterial',
  'isTexture',
  'isVector3',
  'isVector2',
  'isMatrix4',
  'isQuaternion',
  'isEuler',
  'isCamera',
  'isLight',
  'isMesh',
  'isGroup',
  'isScene',
  'isRenderer'
];

// List of function names that indicate Three.js objects
const THREE_JS_METHODS = [
  'updateMatrix',
  'updateMatrixWorld',
  'raycast',
  'dispose',
  'render',
  'setSize',
  'lookAt',
  'translateX',
  'rotateY',
  'normalizeNormals'
];

/**
 * Check if an object contains Three.js objects
 * @returns {boolean} true if Three.js detected
 */
export function containsThreeJS(obj, visited = new WeakSet(), path = 'root') {
  // Handle primitives
  if (obj === null || obj === undefined) return false;
  if (typeof obj !== 'object') return false;
  
  // Prevent circular reference infinite loops
  if (visited.has(obj)) {
    console.log(`Circular reference detected at ${path}`);
    return false;
  }
  visited.add(obj);
  
  // Check for Three.js signatures
  for (const signature of THREE_JS_SIGNATURES) {
    if (obj[signature] === true) {
      console.warn(`Found Three.js object at ${path}: ${signature}`);
      return true;
    }
  }
  
  // Check for Three.js methods
  for (const method of THREE_JS_METHODS) {
    if (typeof obj[method] === 'function') {
      console.warn(`Found Three.js method at ${path}: ${method}`);
      return true;
    }
  }
  
  // Check if it's a Three.js namespace object
  if (obj.constructor && obj.constructor.name && obj.constructor.name.startsWith('THREE')) {
    console.warn(`Found Three.js class at ${path}: ${obj.constructor.name}`);
    return true;
  }
  
  // Recursively check arrays
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (containsThreeJS(obj[i], visited, `${path}[${i}]`)) {
        return true;
      }
    }
  }
  
  // Recursively check object properties
  else {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        if (containsThreeJS(value, visited, `${path}.${key}`)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Strip out any Three.js objects from data
 */
export function stripThreeJS(obj, visited = new WeakSet(), path = 'root') {
  // Handle primitives
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  // Prevent circular references
  if (visited.has(obj)) {
    console.log(`Circular reference at ${path}, returning null`);
    return null;
  }
  visited.add(obj);
  
  // Check for Three.js signatures
  for (const signature of THREE_JS_SIGNATURES) {
    if (obj[signature] === true) {
      console.log(`Stripping Three.js object at ${path}`);
      return null;
    }
  }
  
  // Check for Three.js constructor
  if (obj.constructor && obj.constructor.name && obj.constructor.name.startsWith('THREE')) {
    console.log(`Stripping Three.js class at ${path}: ${obj.constructor.name}`);
    return null;
  }
  
  // Process arrays
  if (Array.isArray(obj)) {
    return obj
      .map((item, i) => stripThreeJS(item, visited, `${path}[${i}]`))
      .filter(item => item !== null);
  }
  
  // Process objects
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip functions
    if (typeof value === 'function') {
      continue;
    }
    
    // Skip Three.js objects
    if (typeof value === 'object' && value !== null) {
      const cleanedValue = stripThreeJS(value, visited, `${path}.${key}`);
      if (cleanedValue !== null) {
        cleaned[key] = cleanedValue;
      }
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Safe checker that combines all safety checks
 */
export function sanitizeForStorage(data, description = 'data') {
  console.log(`Sanitizing ${description}...`);
  
  // First check if it contains Three.js
  if (containsThreeJS(data)) {
    console.warn(`Three.js objects detected in ${description}, stripping...`);
    data = stripThreeJS(data);
  }
  
  // Verify it's now clean
  if (containsThreeJS(data)) {
    console.error(`Failed to remove all Three.js objects from ${description}`);
    return null;
  }
  
  // Try to stringify as final test
  try {
    JSON.stringify(data);
    console.log(`${description} is safe for storage`);
    return data;
  } catch (error) {
    console.error(`${description} cannot be stringified:`, error);
    return null;
  }
}

/**
 * Monitor function to check data before any save operation
 */
export function createSaveMonitor() {
  const originalSetItem = localStorage.setItem;
  
  // Override localStorage.setItem with safety check
  localStorage.setItem = function(key, value) {
    console.log(`Intercepting localStorage.setItem for key: ${key}`);
    
    // Skip check for non-JSON data
    if (typeof value !== 'string' || !value.startsWith('{') && !value.startsWith('[')) {
      return originalSetItem.call(localStorage, key, value);
    }
    
    try {
      const parsed = JSON.parse(value);
      if (containsThreeJS(parsed)) {
        console.error(`BLOCKED: Attempted to save Three.js object to localStorage[${key}]`);
        console.trace(); // Show stack trace to find the culprit
        
        // Strip and save cleaned version instead
        const cleaned = stripThreeJS(parsed);
        return originalSetItem.call(localStorage, key, JSON.stringify(cleaned));
      }
    } catch (e) {
      // Not JSON, let it through
    }
    
    return originalSetItem.call(localStorage, key, value);
  };
  
  console.log('Save monitor installed - Three.js objects will be blocked');
}
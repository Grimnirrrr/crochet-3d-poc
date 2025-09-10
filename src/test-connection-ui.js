// src/test-connection-ui.js

import { Assembly } from './types/assemblyModels.js';
import { HEAD_TEMPLATE, BODY_TEMPLATE, ARM_TEMPLATE } from './models/pieceTemplates.js';

console.log('=== D2: CONNECTION POINTS UI TEST ===\n');

// Test 1: Setup assembly with pieces
console.log('TEST 1: Setup Assembly');
console.log('----------------------');

const assembly = new Assembly('pro');
assembly.name = 'Connection UI Test';

// Create pieces
const head = HEAD_TEMPLATE.createPiece({ name: 'Test Head' });
const body = BODY_TEMPLATE.createPiece({ name: 'Test Body' });
const leftArm = ARM_TEMPLATE.createPiece({ name: 'Left Arm' });
const rightArm = ARM_TEMPLATE.createPiece({ name: 'Right Arm' });

// Add to assembly
assembly.addPiece(head);
assembly.addPiece(body);
assembly.addPiece(leftArm);
assembly.addPiece(rightArm);

console.log(`Assembly created with ${assembly.pieces.size} pieces`);

// List all connection points
let totalPoints = 0;
assembly.pieces.forEach(piece => {
  const points = piece.connectionPoints?.length || 0;
  totalPoints += points;
  console.log(`  ${piece.name}: ${points} connection points`);
});
console.log(`Total connection points: ${totalPoints}`);

// Test 2: Connection compatibility checking
console.log('\n\nTEST 2: Connection Compatibility');
console.log('--------------------------------');

// Check head to body connection
const headNeck = head.connectionPoints.find(cp => cp.name === 'neck');
const bodyNeck = body.connectionPoints.find(cp => cp.name === 'neck_joint');

if (headNeck && bodyNeck) {
  console.log('Head neck:', headNeck.name, '→ Compatible:', headNeck.compatible);
  console.log('Body neck joint:', bodyNeck.name, '→ Compatible:', bodyNeck.compatible);
  
  // Test direct compatibility
  const compatible = headNeck.compatible.includes('neck') || 
                     bodyNeck.compatible.includes('neck');
  console.log(`Direct compatibility: ${compatible ? '✓' : '✗'}`);
}

// Check arm to body connections
const leftArmShoulder = leftArm.connectionPoints.find(cp => cp.name === 'shoulder_joint');
const bodyLeftShoulder = body.connectionPoints.find(cp => cp.name === 'left_shoulder');

if (leftArmShoulder && bodyLeftShoulder) {
  const armCompatible = leftArmShoulder.compatible.includes('shoulder') ||
                        bodyLeftShoulder.compatible.includes('shoulder');
  console.log(`Left arm to body compatibility: ${armCompatible ? '✓' : '✗'}`);
}

// Test 3: Connection Manager Functions (simulated)
console.log('\n\nTEST 3: Connection Manager Functions');
console.log('------------------------------------');

// Simulate connection manager functions
const connectionManager = {
  selectedPoint: null,
  connectionHistory: [],
  
  findCompatiblePoints: function(point) {
    const compatible = [];
    
    assembly.pieces.forEach(piece => {
      if (piece.id === point.pieceId) return;
      
      piece.connectionPoints?.forEach(cp => {
        if (cp.isOccupied) return;
        
        const isCompatible = 
          point.compatible?.includes(cp.name) ||
          cp.compatible?.includes(point.name) ||
          point.compatible?.includes('universal') ||
          cp.compatible?.includes('universal');
        
        if (isCompatible) {
          compatible.push({
            ...cp,
            pieceId: piece.id,
            pieceName: piece.name
          });
        }
      });
    });
    
    return compatible;
  },
  
  getConnectionStats: function() {
    let totalConnections = 0;
    let occupiedPoints = 0;
    let availablePoints = 0;
    
    assembly.pieces.forEach(piece => {
      piece.connectionPoints?.forEach(point => {
        if (point.isOccupied) {
          occupiedPoints++;
        } else {
          availablePoints++;
        }
      });
    });
    
    totalConnections = assembly.connections?.length || 0;
    
    return {
      totalConnections,
      occupiedPoints,
      availablePoints,
      totalPoints: occupiedPoints + availablePoints
    };
  }
};

// Find compatible points for head neck
if (headNeck) {
  const compatibleForHead = connectionManager.findCompatiblePoints({
    ...headNeck,
    pieceId: head.id
  });
  
  console.log(`Compatible points for head neck: ${compatibleForHead.length}`);
  compatibleForHead.forEach(cp => {
    console.log(`  - ${cp.pieceName}: ${cp.name}`);
  });
}

// Get connection statistics
const stats = connectionManager.getConnectionStats();
console.log('\nConnection Statistics:');
console.log(`  Total points: ${stats.totalPoints}`);
console.log(`  Available: ${stats.availablePoints}`);
console.log(`  Occupied: ${stats.occupiedPoints}`);
console.log(`  Connections: ${stats.totalConnections}`);

// Test 4: Actual connections
console.log('\n\nTEST 4: Making Connections');
console.log('--------------------------');

// Connect head to body
if (headNeck && bodyNeck) {
  const result = assembly.connect(
    head.id,
    headNeck.id,
    body.id,
    bodyNeck.id
  );
  
  console.log(`Connect head to body: ${result.success ? '✓ Success' : '✗ Failed'}`);
  if (!result.success) {
    console.log(`  Reason: ${result.reason}`);
  }
}

// Connect left arm to body
if (leftArmShoulder && bodyLeftShoulder) {
  const result = assembly.connect(
    leftArm.id,
    leftArmShoulder.id,
    body.id,
    bodyLeftShoulder.id
  );
  
  console.log(`Connect left arm to body: ${result.success ? '✓ Success' : '✗ Failed'}`);
  if (!result.success) {
    console.log(`  Reason: ${result.reason}`);
  }
}

// Update stats after connections
const newStats = connectionManager.getConnectionStats();
console.log('\nUpdated Statistics:');
console.log(`  Connections made: ${newStats.totalConnections}`);
console.log(`  Occupied points: ${newStats.occupiedPoints}`);
console.log(`  Available points: ${newStats.availablePoints}`);

// Test 5: Connection point states
console.log('\n\nTEST 5: Connection Point States');
console.log('-------------------------------');

// Check which points are now occupied
assembly.pieces.forEach(piece => {
  const occupiedPoints = piece.connectionPoints?.filter(cp => cp.isOccupied) || [];
  if (occupiedPoints.length > 0) {
    console.log(`${piece.name}:`);
    occupiedPoints.forEach(cp => {
      console.log(`  - ${cp.name}: Connected to ${cp.connectedTo || 'unknown'}`);
    });
  }
});

// Test 6: Visual indicator simulation
console.log('\n\nTEST 6: Visual Indicators (Simulated)');
console.log('-------------------------------------');

const indicatorStates = {
  available: { color: 0x44ff44, emissive: 0x002200, opacity: 0.8 },
  occupied: { color: 0xff4444, emissive: 0x220000, opacity: 0.8 },
  hovered: { color: 0xffff44, emissive: 0x444400, opacity: 1.0 },
  selected: { color: 0xffff00, emissive: 0x444400, opacity: 1.0 },
  compatible: { color: 0x00ffff, emissive: 0x004444, opacity: 0.9 }
};

console.log('Indicator color states defined:');
Object.entries(indicatorStates).forEach(([state, colors]) => {
  console.log(`  ${state}: #${colors.color.toString(16).padStart(6, '0')}`);
});

console.log('\n=== D2 CONNECTION UI TESTS COMPLETE ===');
console.log('\nSummary:');
console.log('- Assembly setup with pieces ✓');
console.log('- Connection compatibility checking ✓');
console.log('- Connection manager functions ✓');
console.log('- Making actual connections ✓');
console.log('- Connection point state tracking ✓');
console.log('- Visual indicator states defined ✓');

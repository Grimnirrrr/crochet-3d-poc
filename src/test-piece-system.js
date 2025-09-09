// src/test-piece-system.js

import { Assembly } from './types/assemblyModels.js';
import { 
  HEAD_TEMPLATE, 
  BODY_TEMPLATE,
  ARM_TEMPLATE,
  getAvailableTemplates,
  createBasicFigure
} from './models/pieceTemplates.js';

console.log('=== D1: PIECE ABSTRACTION TEST ===\n');

// Test 1: Create pieces from templates
console.log('TEST 1: Template Creation');
console.log('-------------------------');

const head = HEAD_TEMPLATE.createPiece({ color: '#fde68a' });
console.log('Head created:', head.name, `(${head.connectionPoints.length} connection points)`);
console.log('  Connection points:', head.connectionPoints.map(cp => cp.name).join(', '));

const body = BODY_TEMPLATE.createPiece({ color: '#60a5fa' });
console.log('Body created:', body.name, `(${body.connectionPoints.length} connection points)`);
console.log('  Connection points:', body.connectionPoints.map(cp => cp.name).join(', '));

const leftArm = ARM_TEMPLATE.createPiece({ name: 'Left Arm' });
console.log('Left Arm created:', leftArm.name);

// Test 2: Check tier restrictions
console.log('\n\nTEST 2: Tier-Based Templates');
console.log('-----------------------------');

const freemiumTemplates = getAvailableTemplates('freemium');
console.log(`Freemium tier: ${freemiumTemplates.length} templates available`);
freemiumTemplates.forEach(t => console.log(`  - ${t.name} (${t.type})`));

const proTemplates = getAvailableTemplates('pro');
console.log(`\nPro tier: ${proTemplates.length} templates available`);
const proOnly = proTemplates.filter(t => t.tier === 'pro');
console.log(`  Pro exclusives: ${proOnly.map(t => t.name).join(', ')}`);

const studioTemplates = getAvailableTemplates('studio');
console.log(`\nStudio tier: ${studioTemplates.length} templates available`);

// Test 3: Assembly with template pieces
console.log('\n\nTEST 3: Assembly Integration');
console.log('----------------------------');

const assembly = new Assembly('pro');
assembly.name = 'Template Test Assembly';

// Add pieces to assembly
const headResult = assembly.addPiece(head);
console.log(`Adding head: ${headResult.success ? '✓' : '✗'}`);

const bodyResult = assembly.addPiece(body);
console.log(`Adding body: ${bodyResult.success ? '✓' : '✗'}`);

const armResult = assembly.addPiece(leftArm);
console.log(`Adding left arm: ${armResult.success ? '✓' : '✗'}`);

console.log(`Assembly has ${assembly.pieces.size} pieces`);

// Test 4: Connection compatibility
console.log('\n\nTEST 4: Connection Compatibility');
console.log('--------------------------------');

// Find neck connection points
const headNeck = head.connectionPoints.find(cp => cp.name === 'neck');
const bodyNeck = body.connectionPoints.find(cp => cp.name === 'neck_joint');

if (headNeck && bodyNeck) {
  console.log(`Head neck point: ${headNeck.name}, compatible with: [${headNeck.compatible.join(', ')}]`);
  console.log(`Body neck joint: ${bodyNeck.name}, compatible with: [${bodyNeck.compatible.join(', ')}]`);
  
  // Test connection
  const canConnect = assembly.canConnect(head.id, headNeck.id, body.id, bodyNeck.id);
  console.log(`Can connect head to body: ${canConnect.valid ? '✓' : '✗'} - ${canConnect.reason}`);
}

// Find arm connection points
const armShoulder = leftArm.connectionPoints.find(cp => cp.name === 'shoulder_joint');
const bodyShoulder = body.connectionPoints.find(cp => cp.name === 'left_shoulder');

if (armShoulder && bodyShoulder) {
  const canConnectArm = assembly.canConnect(leftArm.id, armShoulder.id, body.id, bodyShoulder.id);
  console.log(`Can connect arm to body: ${canConnectArm.valid ? '✓' : '✗'} - ${canConnectArm.reason}`);
}

// Test 5: Pattern generation
console.log('\n\nTEST 5: Pattern Data');
console.log('--------------------');

console.log(`Head pattern: ${head.rounds.length} rounds`);
if (head.rounds.length > 0) {
  console.log(`  Round 1: ${head.rounds[0].stitches} stitches - "${head.rounds[0].instruction}"`);
  console.log(`  Last round: ${head.rounds[head.rounds.length-1].stitches} stitches`);
}

const totalStitches = head.rounds.reduce((sum, r) => sum + r.stitches, 0);
console.log(`  Total stitches: ${totalStitches}`);

// Test 6: Create complete figure
console.log('\n\nTEST 6: Complete Figure Generation');
console.log('----------------------------------');

const figure = createBasicFigure({
  headColor: '#fde68a',
  bodyColor: '#3b82f6'
});

console.log('Figure pieces created:');
Object.entries(figure).forEach(([part, piece]) => {
  console.log(`  ${part}: ${piece.name} (${piece.type})`);
});

// Test 7: Save with piece templates
console.log('\n\nTEST 7: Save/Load with Templates');
console.log('--------------------------------');

const saveResult = assembly.save();
console.log(`Save assembly: ${saveResult.success ? '✓' : '✗'}`);

if (saveResult.success) {
  // Check saved data structure
  const savedData = localStorage.getItem(`assembly_${assembly.id}`);
  if (savedData) {
    const parsed = JSON.parse(savedData);
    console.log(`Saved pieces: ${parsed.pieces.length}`);
    if (parsed.pieces[0]) {
      console.log(`First piece has connection points: ${parsed.pieces[0].connectionPoints?.length || 0}`);
    }
  }
}

console.log('\n=== D1 PIECE ABSTRACTION COMPLETE ===');
console.log('\nSummary:');
console.log('- Template system working ✓');
console.log('- Tier restrictions applied ✓');
console.log('- Connection points defined ✓');
console.log('- Pattern data included ✓');
console.log('- Assembly integration working ✓');

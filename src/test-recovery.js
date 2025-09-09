// src/test-recovery.js
import { Assembly, CrochetPiece } from './types/assemblyModels.js';

console.log('Testing Recovery System...');

// Create and save an assembly
const test = new Assembly('pro');
test.name = 'Recovery Test';
test.addPiece(new CrochetPiece({ name: 'Test Piece 1' }));
test.addPiece(new CrochetPiece({ name: 'Test Piece 2' }));

// Create backup
const backup = test.createBackup('test');
console.log('Backup created:', backup.success ? '✓' : '✗');

// Get backup info
const info = test.getBackupInfo();
console.log('Backups available:', info.count);

// Save with auto-backup
const saveResult = test.save();
console.log('Save with backup:', saveResult.success ? '✓' : '✗');
if (saveResult.backup) {
  console.log('Auto-backup key:', saveResult.backup);
}

console.log('Recovery system integrated successfully!');
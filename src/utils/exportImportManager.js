// src/utils/exportImportManager.js
// D14: Comprehensive export/import system

import { toSafeVector3, toSafeColor, createSafePieceData } from './safeTypes';

export class ExportImportManager {
  constructor() {
    this.exportFormats = new Map();
    this.importParsers = new Map();
    this.version = '2.0.0';
    this.compressionEnabled = true;
    
    this.initializeFormats();
    this.initializeParsers();
  }
  
  initializeFormats() {
    // JSON format - Complete project
    this.exportFormats.set('json', {
      name: 'JSON Project',
      extension: '.c3d',
      mimeType: 'application/json',
      description: 'Complete project with all data',
      exporter: (data) => this.exportJSON(data)
    });
    
    // Pattern format - Crochet instructions
    this.exportFormats.set('pattern', {
      name: 'Crochet Pattern',
      extension: '.pattern',
      mimeType: 'text/plain',
      description: 'Human-readable crochet pattern',
      exporter: (data) => this.exportPattern(data)
    });
    
    // SVG format - 2D diagram
    this.exportFormats.set('svg', {
      name: 'SVG Diagram',
      extension: '.svg',
      mimeType: 'image/svg+xml',
      description: '2D vector diagram',
      exporter: (data) => this.exportSVG(data)
    });
    
    // PDF format - Printable instructions
    this.exportFormats.set('pdf', {
      name: 'PDF Instructions',
      extension: '.pdf',
      mimeType: 'application/pdf',
      description: 'Printable pattern with diagrams',
      exporter: (data) => this.exportPDF(data)
    });
    
    // OBJ format - 3D model
    this.exportFormats.set('obj', {
      name: '3D Model (OBJ)',
      extension: '.obj',
      mimeType: 'model/obj',
      description: '3D model for viewing/printing',
      exporter: (data) => this.exportOBJ(data)
    });
    
    // CSV format - Data export
    this.exportFormats.set('csv', {
      name: 'CSV Data',
      extension: '.csv',
      mimeType: 'text/csv',
      description: 'Spreadsheet-compatible data',
      exporter: (data) => this.exportCSV(data)
    });
    
    // Backup format - Complete backup
    this.exportFormats.set('backup', {
      name: 'Full Backup',
      extension: '.c3d-backup',
      mimeType: 'application/octet-stream',
      description: 'Complete backup with history',
      exporter: (data) => this.exportBackup(data)
    });
  }
  
  initializeParsers() {
    // JSON parser
    this.importParsers.set('json', {
      extensions: ['.json', '.c3d'],
      parser: (content) => this.parseJSON(content)
    });
    
    // Pattern parser
    this.importParsers.set('pattern', {
      extensions: ['.pattern', '.txt'],
      parser: (content) => this.parsePattern(content)
    });
    
    // CSV parser
    this.importParsers.set('csv', {
      extensions: ['.csv'],
      parser: (content) => this.parseCSV(content)
    });
    
    // Backup parser
    this.importParsers.set('backup', {
      extensions: ['.c3d-backup'],
      parser: (content) => this.parseBackup(content)
    });
  }
  
  // ==================== EXPORT METHODS ====================
  
  async export(assembly, format = 'json', options = {}) {
    const formatter = this.exportFormats.get(format);
    if (!formatter) {
      throw new Error(`Unknown export format: ${format}`);
    }
    
    // Prepare export data
    const exportData = {
      assembly: this.prepareAssemblyForExport(assembly),
      metadata: {
        version: this.version,
        format,
        timestamp: new Date().toISOString(),
        options
      }
    };
    
    // Add optional data based on options
    if (options.includeHistory && assembly.history) {
      exportData.history = assembly.history;
    }
    
    if (options.includeValidation && assembly.validation) {
      exportData.validation = assembly.validation;
    }
    
    if (options.includeSuggestions && assembly.suggestions) {
      exportData.suggestions = assembly.suggestions;
    }
    
    // Generate export
    const result = await formatter.exporter(exportData);
    
    // Compress if enabled
    if (this.compressionEnabled && format !== 'svg' && format !== 'pdf') {
      result.content = this.compress(result.content);
      result.compressed = true;
    }
    
    return result;
  }
  
  exportJSON(data) {
    const json = {
      version: data.metadata.version,
      timestamp: data.metadata.timestamp,
      assembly: {
        id: data.assembly.id,
        name: data.assembly.name,
        pieces: Array.from(data.assembly.pieces.values()).map(p => ({
          id: p.id,
          type: p.type,
          position: toSafeVector3(p.position),
          rotation: toSafeVector3(p.rotation),
          scale: toSafeVector3(p.scale),
          color: toSafeColor(p.color),
          connectionPoints: Array.from(p.connectionPoints.entries()),
          metadata: p.metadata
        })),
        connections: Array.from(data.assembly.connections).map(c => ({
          fromPiece: c.fromPiece,
          fromPoint: c.fromPoint,
          toPiece: c.toPiece,
          toPoint: c.toPoint,
          metadata: c.metadata
        })),
        groups: data.assembly.groups || [],
        metadata: data.assembly.metadata
      },
      history: data.history,
      validation: data.validation,
      suggestions: data.suggestions
    };
    
    return {
      content: JSON.stringify(json, null, 2),
      filename: `${data.assembly.name || 'assembly'}_${Date.now()}.c3d`,
      mimeType: 'application/json'
    };
  }
  
  exportPattern(data) {
    let pattern = '';
    const assembly = data.assembly;
    
    // Header
    pattern += `CROCHET PATTERN: ${assembly.name || 'Untitled'}\n`;
    pattern += `Generated: ${new Date().toLocaleDateString()}\n`;
    pattern += `Pieces: ${assembly.pieces.size}\n`;
    pattern += '=' .repeat(50) + '\n\n';
    
    // Materials
    pattern += 'MATERIALS:\n';
    const colors = new Set();
    for (const piece of assembly.pieces.values()) {
      if (piece.color) colors.add(piece.color);
    }
    colors.forEach(color => {
      pattern += `- Yarn color: ${color}\n`;
    });
    pattern += '- Appropriate crochet hook\n';
    pattern += '- Stitch markers\n';
    pattern += '- Yarn needle\n\n';
    
    // Abbreviations
    pattern += 'ABBREVIATIONS:\n';
    pattern += 'ch = chain\n';
    pattern += 'sc = single crochet\n';
    pattern += 'dc = double crochet\n';
    pattern += 'hdc = half double crochet\n';
    pattern += 'inc = increase\n';
    pattern += 'dec = decrease\n';
    pattern += 'MR = magic ring\n';
    pattern += 'sl = slip stitch\n\n';
    
    // Instructions for each piece
    pattern += 'INSTRUCTIONS:\n\n';
    let pieceNum = 1;
    for (const piece of assembly.pieces.values()) {
      pattern += `PIECE ${pieceNum}: ${piece.type.toUpperCase()}\n`;
      pattern += '-'.repeat(30) + '\n';
      
      if (piece.metadata?.pattern) {
        const stitches = piece.metadata.pattern;
        pattern += 'Pattern: ' + stitches.join(', ') + '\n';
        
        // Format as rounds if applicable
        if (piece.type === 'amigurumi' || piece.type === 'sphere') {
          pattern += '\nRounds:\n';
          let round = 1;
          let stitchIndex = 0;
          while (stitchIndex < stitches.length) {
            const roundStitches = stitches.slice(stitchIndex, stitchIndex + 6);
            pattern += `Round ${round}: ${roundStitches.join(', ')}\n`;
            stitchIndex += 6;
            round++;
          }
        }
      }
      
      pattern += '\n';
      pieceNum++;
    }
    
    // Assembly instructions
    pattern += 'ASSEMBLY:\n';
    pattern += '-'.repeat(30) + '\n';
    let step = 1;
    for (const conn of assembly.connections) {
      const fromPiece = assembly.pieces.get(conn.fromPiece);
      const toPiece = assembly.pieces.get(conn.toPiece);
      pattern += `${step}. Connect ${fromPiece?.type} to ${toPiece?.type}\n`;
      pattern += `   From: ${conn.fromPoint} To: ${conn.toPoint}\n`;
      step++;
    }
    
    pattern += '\n' + '=' .repeat(50) + '\n';
    pattern += 'Pattern generated by Crochet 3D v' + this.version + '\n';
    
    return {
      content: pattern,
      filename: `${assembly.name || 'pattern'}_${Date.now()}.pattern`,
      mimeType: 'text/plain'
    };
  }
  
  exportSVG(data) {
    const assembly = data.assembly;
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    svg += `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
    
    // Background
    svg += `  <rect width="${width}" height="${height}" fill="#f9f9f9"/>\n`;
    
    // Title
    svg += `  <text x="${centerX}" y="30" text-anchor="middle" font-size="20" font-weight="bold">`;
    svg += `${assembly.name || 'Crochet Assembly'}</text>\n`;
    
    // Draw pieces as circles
    const pieces = Array.from(assembly.pieces.values());
    const angleStep = (2 * Math.PI) / pieces.length;
    const radius = Math.min(width, height) * 0.3;
    
    pieces.forEach((piece, index) => {
      const angle = index * angleStep;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Piece circle
      svg += `  <circle cx="${x}" cy="${y}" r="30" fill="${piece.color || '#888'}" `;
      svg += `stroke="#333" stroke-width="2" opacity="0.8"/>\n`;
      
      // Piece label
      svg += `  <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="12" fill="white">`;
      svg += `${piece.type}</text>\n`;
    });
    
    // Draw connections
    for (const conn of assembly.connections) {
      const fromIndex = pieces.findIndex(p => p.id === conn.fromPiece);
      const toIndex = pieces.findIndex(p => p.id === conn.toPiece);
      
      if (fromIndex >= 0 && toIndex >= 0) {
        const fromAngle = fromIndex * angleStep;
        const toAngle = toIndex * angleStep;
        const x1 = centerX + Math.cos(fromAngle) * radius;
        const y1 = centerY + Math.sin(fromAngle) * radius;
        const x2 = centerX + Math.cos(toAngle) * radius;
        const y2 = centerY + Math.sin(toAngle) * radius;
        
        svg += `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" `;
        svg += `stroke="#666" stroke-width="1" stroke-dasharray="5,5" opacity="0.5"/>\n`;
      }
    }
    
    // Footer
    svg += `  <text x="${centerX}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#666">`;
    svg += `Pieces: ${pieces.length} | Connections: ${assembly.connections.size}</text>\n`;
    
    svg += `</svg>`;
    
    return {
      content: svg,
      filename: `${assembly.name || 'diagram'}_${Date.now()}.svg`,
      mimeType: 'image/svg+xml'
    };
  }
  
  exportPDF(data) {
    // PDF generation would require a library like jsPDF
    // This is a placeholder that returns structured data for PDF generation
    return {
      content: {
        title: data.assembly.name || 'Crochet Pattern',
        sections: [
          { type: 'header', content: 'Pattern Information' },
          { type: 'metadata', content: data.metadata },
          { type: 'materials', content: this.extractMaterials(data.assembly) },
          { type: 'instructions', content: this.extractInstructions(data.assembly) },
          { type: 'diagram', content: 'SVG_PLACEHOLDER' },
          { type: 'footer', content: `Generated: ${new Date().toISOString()}` }
        ]
      },
      filename: `${data.assembly.name || 'pattern'}_${Date.now()}.pdf`,
      mimeType: 'application/pdf',
      requiresLibrary: 'jsPDF'
    };
  }
  
  exportOBJ(data) {
    const assembly = data.assembly;
    let obj = '# OBJ file generated by Crochet 3D\n';
    obj += `# Assembly: ${assembly.name || 'Untitled'}\n`;
    obj += `# Date: ${new Date().toISOString()}\n\n`;
    
    let vertexOffset = 1;
    
    // Export each piece as a simple sphere for now
    for (const piece of assembly.pieces.values()) {
      obj += `# Piece: ${piece.id} (${piece.type})\n`;
      
      // Generate sphere vertices (simplified)
      const pos = piece.position || { x: 0, y: 0, z: 0 };
      const scale = piece.scale || { x: 1, y: 1, z: 1 };
      
      // Add 8 vertices for a simple cube representation
      obj += `v ${pos.x - scale.x} ${pos.y - scale.y} ${pos.z - scale.z}\n`;
      obj += `v ${pos.x + scale.x} ${pos.y - scale.y} ${pos.z - scale.z}\n`;
      obj += `v ${pos.x + scale.x} ${pos.y + scale.y} ${pos.z - scale.z}\n`;
      obj += `v ${pos.x - scale.x} ${pos.y + scale.y} ${pos.z - scale.z}\n`;
      obj += `v ${pos.x - scale.x} ${pos.y - scale.y} ${pos.z + scale.z}\n`;
      obj += `v ${pos.x + scale.x} ${pos.y - scale.y} ${pos.z + scale.z}\n`;
      obj += `v ${pos.x + scale.x} ${pos.y + scale.y} ${pos.z + scale.z}\n`;
      obj += `v ${pos.x - scale.x} ${pos.y + scale.y} ${pos.z + scale.z}\n`;
      
      // Add faces
      obj += `f ${vertexOffset} ${vertexOffset+1} ${vertexOffset+2} ${vertexOffset+3}\n`;
      obj += `f ${vertexOffset+4} ${vertexOffset+5} ${vertexOffset+6} ${vertexOffset+7}\n`;
      obj += `f ${vertexOffset} ${vertexOffset+1} ${vertexOffset+5} ${vertexOffset+4}\n`;
      obj += `f ${vertexOffset+2} ${vertexOffset+3} ${vertexOffset+7} ${vertexOffset+6}\n`;
      obj += `f ${vertexOffset} ${vertexOffset+3} ${vertexOffset+7} ${vertexOffset+4}\n`;
      obj += `f ${vertexOffset+1} ${vertexOffset+2} ${vertexOffset+6} ${vertexOffset+5}\n`;
      
      vertexOffset += 8;
      obj += '\n';
    }
    
    return {
      content: obj,
      filename: `${assembly.name || 'model'}_${Date.now()}.obj`,
      mimeType: 'model/obj'
    };
  }
  
  exportCSV(data) {
    const assembly = data.assembly;
    let csv = 'Piece ID,Type,Position X,Position Y,Position Z,Color,Pattern,Connections\n';
    
    for (const piece of assembly.pieces.values()) {
      const connections = Array.from(assembly.connections)
        .filter(c => c.fromPiece === piece.id || c.toPiece === piece.id)
        .length;
      
      csv += `"${piece.id}",`;
      csv += `"${piece.type}",`;
      csv += `${piece.position?.x || 0},`;
      csv += `${piece.position?.y || 0},`;
      csv += `${piece.position?.z || 0},`;
      csv += `"${piece.color || ''}",`;
      csv += `"${piece.metadata?.pattern?.join(' ') || ''}",`;
      csv += `${connections}\n`;
    }
    
    return {
      content: csv,
      filename: `${assembly.name || 'data'}_${Date.now()}.csv`,
      mimeType: 'text/csv'
    };
  }
  
  exportBackup(data) {
    const backup = {
      version: this.version,
      timestamp: new Date().toISOString(),
      assembly: data.assembly,
      history: data.history || [],
      validation: data.validation || {},
      suggestions: data.suggestions || [],
      settings: data.settings || {},
      metadata: {
        pieceCount: data.assembly.pieces.size,
        connectionCount: data.assembly.connections.size,
        compressed: true
      }
    };
    
    const json = JSON.stringify(backup);
    const compressed = this.compress(json);
    
    return {
      content: compressed,
      filename: `backup_${Date.now()}.c3d-backup`,
      mimeType: 'application/octet-stream',
      compressed: true
    };
  }
  
  // ==================== IMPORT METHODS ====================
  
  async import(file, format = 'auto') {
    // Auto-detect format from extension
    if (format === 'auto') {
      format = this.detectFormat(file.name);
    }
    
    const parser = this.importParsers.get(format);
    if (!parser) {
      throw new Error(`Unknown import format: ${format}`);
    }
    
    // Read file content
    const content = await this.readFile(file);
    
    // Decompress if needed
    const decompressed = this.isCompressed(content) ? 
      this.decompress(content) : content;
    
    // Parse content
    const result = await parser.parser(decompressed);
    
    // Validate imported data
    this.validateImport(result);
    
    // Convert to safe types
    result.assembly = this.convertToSafeTypes(result.assembly);
    
    return result;
  }
  
  parseJSON(content) {
    const data = JSON.parse(content);
    
    // Check version compatibility
    if (!this.isVersionCompatible(data.version)) {
      console.warn(`Version mismatch: file ${data.version}, current ${this.version}`);
    }
    
    // Reconstruct assembly
    const assembly = {
      id: data.assembly.id,
      name: data.assembly.name,
      pieces: new Map(),
      connections: new Set(),
      groups: data.assembly.groups || [],
      metadata: data.assembly.metadata || {}
    };
    
    // Restore pieces
    for (const piece of data.assembly.pieces) {
      assembly.pieces.set(piece.id, {
        ...piece,
        connectionPoints: new Map(piece.connectionPoints)
      });
    }
    
    // Restore connections
    for (const conn of data.assembly.connections) {
      assembly.connections.add(conn);
    }
    
    return {
      assembly,
      history: data.history,
      validation: data.validation,
      suggestions: data.suggestions,
      metadata: {
        version: data.version,
        timestamp: data.timestamp
      }
    };
  }
  
  parsePattern(content) {
    const lines = content.split('\n');
    const assembly = {
      id: `imported_${Date.now()}`,
      name: 'Imported Pattern',
      pieces: new Map(),
      connections: new Set()
    };
    
    let currentPiece = null;
    let pieceCounter = 0;
    
    for (const line of lines) {
      // Parse piece definitions
      if (line.startsWith('PIECE')) {
        pieceCounter++;
        const type = line.match(/:\s*(.+)/)?.[1]?.toLowerCase() || 'generic';
        currentPiece = {
          id: `piece_${pieceCounter}`,
          type,
          metadata: { pattern: [] }
        };
        assembly.pieces.set(currentPiece.id, currentPiece);
      }
      
      // Parse pattern
      if (line.startsWith('Pattern:') && currentPiece) {
        const pattern = line.match(/Pattern:\s*(.+)/)?.[1];
        if (pattern) {
          currentPiece.metadata.pattern = pattern.split(',').map(s => s.trim());
        }
      }
    }
    
    return { assembly };
  }
  
  parseCSV(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    
    const assembly = {
      id: `imported_${Date.now()}`,
      name: 'Imported CSV',
      pieces: new Map(),
      connections: new Set()
    };
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;
      
      const piece = {
        id: values[0]?.replace(/"/g, '') || `piece_${i}`,
        type: values[1]?.replace(/"/g, '') || 'generic',
        position: {
          x: parseFloat(values[2]) || 0,
          y: parseFloat(values[3]) || 0,
          z: parseFloat(values[4]) || 0
        },
        color: values[5]?.replace(/"/g, '') || '#888888',
        metadata: {
          pattern: values[6]?.replace(/"/g, '').split(' ').filter(s => s) || []
        }
      };
      
      assembly.pieces.set(piece.id, piece);
    }
    
    return { assembly };
  }
  
  parseBackup(content) {
    // Decompress first
    const decompressed = this.decompress(content);
    return this.parseJSON(decompressed);
  }
  
  // ==================== UTILITY METHODS ====================
  
  prepareAssemblyForExport(assembly) {
    return {
      id: assembly.id,
      name: assembly.name,
      pieces: assembly.pieces,
      connections: assembly.connections,
      groups: assembly.groups || [],
      metadata: assembly.metadata || {}
    };
  }
  
  detectFormat(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    for (const [format, parser] of this.importParsers) {
      if (parser.extensions.includes('.' + extension)) {
        return format;
      }
    }
    
    return 'json'; // Default
  }
  
  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
  
  compress(content) {
    // Simple compression using btoa (base64)
    // In production, use a proper compression library
    try {
      return btoa(encodeURIComponent(content));
    } catch (e) {
      return content;
    }
  }
  
  decompress(content) {
    // Simple decompression using atob
    try {
      return decodeURIComponent(atob(content));
    } catch (e) {
      return content;
    }
  }
  
  isCompressed(content) {
    // Check if content appears to be base64 encoded
    try {
      return /^[A-Za-z0-9+/=]+$/.test(content.replace(/\s/g, ''));
    } catch {
      return false;
    }
  }
  
  isVersionCompatible(version) {
    const [major] = version.split('.');
    const [currentMajor] = this.version.split('.');
    return major === currentMajor;
  }
  
  validateImport(data) {
    if (!data.assembly) {
      throw new Error('Invalid import: missing assembly data');
    }
    
    if (!data.assembly.pieces || data.assembly.pieces.size === 0) {
      throw new Error('Invalid import: no pieces found');
    }
    
    return true;
  }
  
  convertToSafeTypes(assembly) {
    // Convert all pieces to safe types
    for (const [id, piece] of assembly.pieces) {
      piece.position = toSafeVector3(piece.position);
      piece.rotation = toSafeVector3(piece.rotation);
      piece.scale = toSafeVector3(piece.scale);
      piece.color = toSafeColor(piece.color);
    }
    
    return assembly;
  }
  
  extractMaterials(assembly) {
    const materials = [];
    const colors = new Set();
    
    for (const piece of assembly.pieces.values()) {
      if (piece.color) colors.add(piece.color);
    }
    
    colors.forEach(color => {
      materials.push({ type: 'yarn', color });
    });
    
    return materials;
  }
  
  extractInstructions(assembly) {
    const instructions = [];
    
    for (const piece of assembly.pieces.values()) {
      instructions.push({
        piece: piece.id,
        type: piece.type,
        pattern: piece.metadata?.pattern || []
      });
    }
    
    return instructions;
  }
  
  // Download helper
  download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

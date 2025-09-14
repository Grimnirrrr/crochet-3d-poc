// src/utils/instructionsGenerator.js
// D15: Automatic step-by-step instructions generation

import { toSafeVector3 } from './safeTypes';

export class InstructionsGenerator {
  constructor() {
    this.instructionTypes = new Map();
    this.difficultyLevels = ['beginner', 'intermediate', 'advanced'];
    this.currentDifficulty = 'beginner';
    this.language = 'en';
    this.includeImages = true;
    this.includeVideos = false;
    
    this.initializeInstructionTypes();
    this.initializeTemplates();
  }
  
  initializeInstructionTypes() {
    // Define different instruction types
    this.instructionTypes.set('assembly', {
      name: 'Assembly Instructions',
      description: 'Step-by-step assembly guide',
      generator: (assembly) => this.generateAssemblyInstructions(assembly)
    });
    
    this.instructionTypes.set('pattern', {
      name: 'Pattern Instructions',
      description: 'Detailed crochet pattern',
      generator: (assembly) => this.generatePatternInstructions(assembly)
    });
    
    this.instructionTypes.set('technique', {
      name: 'Technique Guide',
      description: 'How to perform stitches',
      generator: (assembly) => this.generateTechniqueGuide(assembly)
    });
    
    this.instructionTypes.set('materials', {
      name: 'Materials List',
      description: 'Required materials and tools',
      generator: (assembly) => this.generateMaterialsList(assembly)
    });
    
    this.instructionTypes.set('troubleshooting', {
      name: 'Troubleshooting Guide',
      description: 'Common issues and solutions',
      generator: (assembly) => this.generateTroubleshootingGuide(assembly)
    });
  }
  
  initializeTemplates() {
    // Stitch abbreviations and descriptions
    this.stitchInfo = {
      'ch': { name: 'Chain', difficulty: 1, time: 1 },
      'sc': { name: 'Single Crochet', difficulty: 1, time: 2 },
      'hdc': { name: 'Half Double Crochet', difficulty: 2, time: 3 },
      'dc': { name: 'Double Crochet', difficulty: 2, time: 3 },
      'tr': { name: 'Treble Crochet', difficulty: 3, time: 4 },
      'sl': { name: 'Slip Stitch', difficulty: 1, time: 1 },
      'inc': { name: 'Increase', difficulty: 2, time: 3 },
      'dec': { name: 'Decrease', difficulty: 2, time: 3 },
      'MR': { name: 'Magic Ring', difficulty: 3, time: 5 },
      'FO': { name: 'Fasten Off', difficulty: 1, time: 2 },
      'join': { name: 'Join', difficulty: 2, time: 2 },
      'turn': { name: 'Turn', difficulty: 1, time: 1 }
    };
    
    // Common patterns
    this.commonPatterns = {
      'sphere': ['MR', 'sc', 'inc', 'sc', 'sc', 'inc', 'sc', 'sc', 'sc', 'inc'],
      'cylinder': ['ch', 'sc', 'sc', 'sc', 'sc', 'sc', 'join', 'turn'],
      'cone': ['MR', 'sc', 'inc', 'sc', 'inc', 'sc', 'sc', 'sc', 'sc'],
      'flat': ['ch', 'sc', 'turn', 'ch', 'sc', 'turn']
    };
  }
  
  // ==================== MAIN GENERATION ====================
  
  generateInstructions(assembly, options = {}) {
    const {
      type = 'assembly',
      difficulty = this.currentDifficulty,
      includeImages = this.includeImages,
      includeVideos = this.includeVideos,
      language = this.language
    } = options;
    
    // Update settings
    this.currentDifficulty = difficulty;
    this.includeImages = includeImages;
    this.includeVideos = includeVideos;
    this.language = language;
    
    // Generate base instructions
    const instructions = {
      id: `instructions_${Date.now()}`,
      assemblyId: assembly.id,
      assemblyName: assembly.name,
      type,
      difficulty,
      language,
      generated: new Date().toISOString(),
      metadata: {
        pieceCount: assembly.pieces.size,
        connectionCount: assembly.connections.size,
        estimatedTime: this.estimateTime(assembly),
        skillLevel: this.determineSkillLevel(assembly)
      },
      sections: []
    };
    
    // Add overview section
    instructions.sections.push(this.generateOverview(assembly));
    
    // Add materials section
    instructions.sections.push(this.generateMaterialsSection(assembly));
    
    // Add preparation section
    instructions.sections.push(this.generatePreparationSection(assembly));
    
    // Generate main instructions based on type
    const generator = this.instructionTypes.get(type);
    if (generator) {
      const mainInstructions = generator.generator(assembly);
      instructions.sections.push(...mainInstructions);
    }
    
    // Add finishing section
    instructions.sections.push(this.generateFinishingSection(assembly));
    
    // Add tips section
    instructions.sections.push(this.generateTipsSection(assembly));
    
    // Add troubleshooting if needed
    if (difficulty === 'beginner') {
      instructions.sections.push(this.generateTroubleshootingSection(assembly));
    }
    
    return instructions;
  }
  
  // ==================== SECTION GENERATORS ====================
  
  generateOverview(assembly) {
    const pieces = Array.from(assembly.pieces.values());
    const pieceTypes = new Set(pieces.map(p => p.type));
    
    return {
      type: 'overview',
      title: 'Project Overview',
      content: {
        description: `This project consists of ${pieces.length} pieces forming a ${assembly.name || 'crochet assembly'}.`,
        difficulty: this.determineSkillLevel(assembly),
        estimatedTime: this.formatTime(this.estimateTime(assembly)),
        finalSize: this.estimateSize(assembly),
        pieceBreakdown: Array.from(pieceTypes).map(type => ({
          type,
          count: pieces.filter(p => p.type === type).length
        }))
      },
      visual: this.generateOverviewDiagram(assembly)
    };
  }
  
  generateMaterialsSection(assembly) {
    const materials = this.analyzeMaterials(assembly);
    
    return {
      type: 'materials',
      title: 'Materials & Tools',
      content: {
        yarn: materials.yarn,
        hook: materials.hook,
        notions: materials.notions,
        optional: materials.optional
      },
      tips: this.getMaterialsTips(materials)
    };
  }
  
  generatePreparationSection(assembly) {
    return {
      type: 'preparation',
      title: 'Before You Begin',
      content: {
        workspace: 'Set up a comfortable workspace with good lighting',
        gauge: this.generateGaugeInfo(assembly),
        techniques: this.listRequiredTechniques(assembly),
        abbreviations: this.getRelevantAbbreviations(assembly)
      }
    };
  }
  
  generateAssemblyInstructions(assembly) {
    const steps = [];
    const pieces = Array.from(assembly.pieces.values());
    const connections = Array.from(assembly.connections);
    
    // Step 1: Create individual pieces
    const pieceSteps = this.generatePieceInstructions(pieces);
    steps.push({
      type: 'piece-creation',
      title: 'Part 1: Creating the Pieces',
      steps: pieceSteps
    });
    
    // Step 2: Connect pieces
    const connectionSteps = this.generateConnectionInstructions(connections, assembly);
    steps.push({
      type: 'assembly',
      title: 'Part 2: Assembly',
      steps: connectionSteps
    });
    
    return steps;
  }
  
  generatePatternInstructions(assembly) {
    const steps = [];
    
    for (const [index, piece] of Array.from(assembly.pieces.values()).entries()) {
      const pattern = piece.metadata?.pattern || [];
      
      if (pattern.length > 0) {
        steps.push({
          type: 'pattern',
          title: `${piece.type} (Piece ${index + 1})`,
          steps: this.convertPatternToSteps(pattern, piece)
        });
      }
    }
    
    return steps;
  }
  
  generateTechniqueGuide(assembly) {
    const techniques = this.extractTechniques(assembly);
    
    return [{
      type: 'techniques',
      title: 'Techniques Used',
      steps: techniques.map(tech => ({
        name: tech,
        description: this.getTechniqueDescription(tech),
        difficulty: this.stitchInfo[tech]?.difficulty || 1,
        visual: this.generateTechniqueVisual(tech)
      }))
    }];
  }
  
  generateFinishingSection(assembly) {
    return {
      type: 'finishing',
      title: 'Finishing Touches',
      content: {
        weaving: 'Weave in all ends securely',
        blocking: this.getBlockingInstructions(assembly),
        embellishments: this.suggestEmbellishments(assembly)
      }
    };
  }
  
  generateTipsSection(assembly) {
    const tips = [];
    
    // Difficulty-based tips
    if (this.currentDifficulty === 'beginner') {
      tips.push('Count your stitches at the end of each round');
      tips.push('Use stitch markers to mark important points');
      tips.push('Take breaks to avoid hand fatigue');
    }
    
    // Pattern-specific tips
    if (this.hasComplexPattern(assembly)) {
      tips.push('Keep a row counter handy');
      tips.push('Make notes as you go');
    }
    
    // Size-based tips
    if (assembly.pieces.size > 10) {
      tips.push('Label pieces as you complete them');
      tips.push('Store completed pieces in separate bags');
    }
    
    return {
      type: 'tips',
      title: 'Tips & Tricks',
      content: tips
    };
  }
  
  generateTroubleshootingSection(assembly) {
    const issues = [];
    
    issues.push({
      problem: 'Piece is too small/large',
      solution: 'Check your gauge and adjust hook size accordingly'
    });
    
    issues.push({
      problem: 'Edges are curling',
      solution: 'Ensure consistent tension and consider blocking'
    });
    
    issues.push({
      problem: 'Lost count of stitches',
      solution: 'Count carefully and use stitch markers at regular intervals'
    });
    
    if (this.hasColorChanges(assembly)) {
      issues.push({
        problem: 'Visible color changes',
        solution: 'Change colors at the back of the work or use invisible join method'
      });
    }
    
    return {
      type: 'troubleshooting',
      title: 'Troubleshooting',
      content: issues
    };
  }
  
  // ==================== DETAIL GENERATORS ====================
  
  generatePieceInstructions(pieces) {
    const steps = [];
    
    for (const [index, piece] of pieces.entries()) {
      const pattern = piece.metadata?.pattern || this.commonPatterns[piece.type] || [];
      
      steps.push({
        stepNumber: index + 1,
        title: `Make ${piece.type}`,
        description: this.describePiece(piece),
        pattern: pattern,
        details: {
          color: piece.color || 'main color',
          size: this.estimatePieceSize(piece),
          time: this.estimatePieceTime(pattern)
        },
        visual: this.generatePieceVisual(piece),
        tips: this.getPieceTips(piece)
      });
    }
    
    return steps;
  }
  
  generateConnectionInstructions(connections, assembly) {
    const steps = [];
    
    for (const [index, conn] of connections.entries()) {
      const fromPiece = assembly.pieces.get(conn.fromPiece);
      const toPiece = assembly.pieces.get(conn.toPiece);
      
      steps.push({
        stepNumber: index + 1,
        title: `Connect ${fromPiece?.type} to ${toPiece?.type}`,
        description: this.describeConnection(conn, fromPiece, toPiece),
        technique: this.getConnectionTechnique(conn),
        details: {
          fromPoint: conn.fromPoint,
          toPoint: conn.toPoint,
          method: 'whip stitch' // Could be determined by connection type
        },
        visual: this.generateConnectionVisual(conn, fromPiece, toPiece),
        tips: ['Ensure pieces are aligned before sewing', 'Use matching yarn color for invisible seams']
      });
    }
    
    return steps;
  }
  
  convertPatternToSteps(pattern, piece) {
    const steps = [];
    let currentRound = 1;
    let stitchCount = 0;
    
    // Group pattern into rounds/rows
    const rounds = this.groupPatternIntoRounds(pattern);
    
    for (const round of rounds) {
      const roundStitches = round.join(', ');
      stitchCount = this.calculateStitchCount(round);
      
      steps.push({
        round: currentRound,
        instruction: `Round ${currentRound}: ${roundStitches}`,
        stitchCount,
        detail: this.explainRound(round),
        tip: this.getRoundTip(round, currentRound)
      });
      
      currentRound++;
    }
    
    return steps;
  }
  
  // ==================== HELPER METHODS ====================
  
  estimateTime(assembly) {
    let totalMinutes = 0;
    
    // Time for pieces
    for (const piece of assembly.pieces.values()) {
      const pattern = piece.metadata?.pattern || [];
      totalMinutes += this.estimatePieceTime(pattern);
    }
    
    // Time for assembly
    totalMinutes += assembly.connections.size * 5; // 5 minutes per connection
    
    // Add finishing time
    totalMinutes += 30;
    
    return totalMinutes;
  }
  
  estimatePieceTime(pattern) {
    let minutes = 0;
    
    for (const stitch of pattern) {
      const info = this.stitchInfo[stitch];
      minutes += info ? info.time : 2;
    }
    
    return minutes;
  }
  
  formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 480) { // Less than 8 hours
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours} hours ${mins} minutes` : `${hours} hours`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours} hours (multiple sessions)`;
    }
  }
  
  determineSkillLevel(assembly) {
    let maxDifficulty = 1;
    
    // Check piece patterns
    for (const piece of assembly.pieces.values()) {
      const pattern = piece.metadata?.pattern || [];
      for (const stitch of pattern) {
        const info = this.stitchInfo[stitch];
        if (info && info.difficulty > maxDifficulty) {
          maxDifficulty = info.difficulty;
        }
      }
    }
    
    // Check assembly complexity
    if (assembly.pieces.size > 10) maxDifficulty = Math.max(maxDifficulty, 2);
    if (assembly.connections.size > 15) maxDifficulty = Math.max(maxDifficulty, 3);
    
    if (maxDifficulty === 1) return 'beginner';
    if (maxDifficulty === 2) return 'intermediate';
    return 'advanced';
  }
  
  estimateSize(assembly) {
    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (const piece of assembly.pieces.values()) {
      const pos = piece.position || { x: 0, y: 0, z: 0 };
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
      minZ = Math.min(minZ, pos.z);
      maxZ = Math.max(maxZ, pos.z);
    }
    
    const width = Math.abs(maxX - minX) || 10;
    const height = Math.abs(maxY - minY) || 10;
    const depth = Math.abs(maxZ - minZ) || 10;
    
    return `Approximately ${width}cm x ${height}cm x ${depth}cm`;
  }
  
  analyzeMaterials(assembly) {
    const colors = new Set();
    let totalYarn = 0;
    
    for (const piece of assembly.pieces.values()) {
      if (piece.color) colors.add(piece.color);
      const pattern = piece.metadata?.pattern || [];
      totalYarn += pattern.length * 2; // Rough estimate
    }
    
    return {
      yarn: Array.from(colors).map(color => ({
        color,
        amount: `${Math.ceil(totalYarn / colors.size)} yards`,
        weight: 'Worsted weight (4)'
      })),
      hook: 'Size H/8 (5.0mm) crochet hook',
      notions: [
        'Yarn needle',
        'Scissors',
        'Stitch markers',
        'Row counter (optional)'
      ],
      optional: [
        'Blocking mats and pins',
        'Safety eyes (if making amigurumi)',
        'Fiberfill stuffing'
      ]
    };
  }
  
  groupPatternIntoRounds(pattern) {
    const rounds = [];
    const roundSize = 6; // Default round size
    
    for (let i = 0; i < pattern.length; i += roundSize) {
      rounds.push(pattern.slice(i, i + roundSize));
    }
    
    return rounds;
  }
  
  calculateStitchCount(round) {
    let count = 0;
    
    for (const stitch of round) {
      if (stitch === 'inc') {
        count += 2;
      } else if (stitch === 'dec') {
        count -= 1;
      } else if (stitch !== 'ch' && stitch !== 'turn') {
        count += 1;
      }
    }
    
    return count;
  }
  
  describePiece(piece) {
    const baseDescription = `Create a ${piece.type} piece`;
    
    if (piece.metadata?.pattern) {
      return `${baseDescription} using the pattern provided`;
    }
    
    return `${baseDescription} following standard ${piece.type} construction`;
  }
  
  describeConnection(conn, fromPiece, toPiece) {
    return `Attach the ${conn.fromPoint} of the ${fromPiece?.type} to the ${conn.toPoint} of the ${toPiece?.type}`;
  }
  
  getConnectionTechnique(conn) {
    // Could be determined by connection metadata
    return 'whip stitch';
  }
  
  explainRound(round) {
    const explanations = [];
    
    for (const stitch of round) {
      const info = this.stitchInfo[stitch];
      if (info && this.currentDifficulty === 'beginner') {
        explanations.push(`${stitch}: ${info.name}`);
      }
    }
    
    return explanations.join(', ');
  }
  
  getRoundTip(round, roundNumber) {
    if (round.includes('inc') && roundNumber === 1) {
      return 'Place a stitch marker at the beginning of the round';
    }
    
    if (round.includes('dec')) {
      return 'Decrease evenly around for best shaping';
    }
    
    return null;
  }
  
  getPieceTips(piece) {
    const tips = [];
    
    if (piece.type === 'sphere' || piece.type === 'ball') {
      tips.push('Stuff firmly before closing');
    }
    
    if (piece.metadata?.pattern?.includes('MR')) {
      tips.push('Pull magic ring tight before continuing');
    }
    
    return tips;
  }
  
  getMaterialsTips(materials) {
    const tips = [];
    
    if (materials.yarn.length > 1) {
      tips.push('Keep consistent tension when changing colors');
    }
    
    tips.push('Buy extra yarn from the same dye lot');
    
    return tips;
  }
  
  listRequiredTechniques(assembly) {
    const techniques = new Set();
    
    for (const piece of assembly.pieces.values()) {
      const pattern = piece.metadata?.pattern || [];
      for (const stitch of pattern) {
        if (this.stitchInfo[stitch]) {
          techniques.add(stitch);
        }
      }
    }
    
    return Array.from(techniques).map(tech => ({
      abbreviation: tech,
      name: this.stitchInfo[tech].name,
      difficulty: this.stitchInfo[tech].difficulty
    }));
  }
  
  getRelevantAbbreviations(assembly) {
    const abbrevs = this.listRequiredTechniques(assembly);
    return abbrevs.sort((a, b) => a.difficulty - b.difficulty);
  }
  
  generateGaugeInfo(assembly) {
    return '4 inches = 16 sc x 16 rows (adjust hook size as needed)';
  }
  
  getBlockingInstructions(assembly) {
    const hasFlat = Array.from(assembly.pieces.values()).some(p => 
      p.type === 'flat' || p.type === 'square'
    );
    
    if (hasFlat) {
      return 'Pin flat pieces to shape and spray lightly with water. Allow to dry completely.';
    }
    
    return 'Blocking optional for 3D pieces';
  }
  
  suggestEmbellishments(assembly) {
    const suggestions = [];
    
    if (assembly.name?.toLowerCase().includes('amigurumi')) {
      suggestions.push('Add safety eyes and embroidered details');
    }
    
    suggestions.push('Consider adding a keychain or hanging loop');
    
    return suggestions;
  }
  
  hasComplexPattern(assembly) {
    for (const piece of assembly.pieces.values()) {
      const pattern = piece.metadata?.pattern || [];
      if (pattern.length > 20) return true;
    }
    return false;
  }
  
  hasColorChanges(assembly) {
    const colors = new Set();
    for (const piece of assembly.pieces.values()) {
      if (piece.color) colors.add(piece.color);
    }
    return colors.size > 1;
  }
  
  extractTechniques(assembly) {
    const techniques = new Set();
    
    for (const piece of assembly.pieces.values()) {
      const pattern = piece.metadata?.pattern || [];
      for (const stitch of pattern) {
        if (this.stitchInfo[stitch]) {
          techniques.add(stitch);
        }
      }
    }
    
    return Array.from(techniques);
  }
  
  getTechniqueDescription(tech) {
    const descriptions = {
      'MR': 'Create a loop, work stitches into the loop, then pull tight to close',
      'sc': 'Insert hook, yarn over, pull through, yarn over, pull through both loops',
      'inc': 'Work 2 stitches in the same stitch',
      'dec': 'Work 2 stitches together as one'
    };
    
    return descriptions[tech] || `Perform ${this.stitchInfo[tech]?.name || tech}`;
  }
  
  // ==================== VISUAL GENERATORS ====================
  
  generateOverviewDiagram(assembly) {
    return {
      type: 'diagram',
      description: 'Assembly overview showing all pieces',
      data: {
        pieces: Array.from(assembly.pieces.values()).map(p => ({
          id: p.id,
          type: p.type,
          position: p.position
        })),
        connections: Array.from(assembly.connections)
      }
    };
  }
  
  generatePieceVisual(piece) {
    return {
      type: 'piece',
      description: `Visual guide for ${piece.type}`,
      data: {
        type: piece.type,
        color: piece.color,
        pattern: piece.metadata?.pattern
      }
    };
  }
  
  generateConnectionVisual(conn, fromPiece, toPiece) {
    return {
      type: 'connection',
      description: 'How to connect the pieces',
      data: {
        from: { type: fromPiece?.type, point: conn.fromPoint },
        to: { type: toPiece?.type, point: conn.toPoint }
      }
    };
  }
  
  generateTechniqueVisual(tech) {
    return {
      type: 'technique',
      description: `How to perform ${this.stitchInfo[tech]?.name || tech}`,
      data: { technique: tech }
    };
  }
  
  // ==================== EXPORT ====================
  
  exportInstructions(instructions, format = 'html') {
    switch (format) {
      case 'html':
        return this.exportAsHTML(instructions);
      case 'pdf':
        return this.exportAsPDF(instructions);
      case 'markdown':
        return this.exportAsMarkdown(instructions);
      case 'json':
        return JSON.stringify(instructions, null, 2);
      default:
        return instructions;
    }
  }
  
  exportAsHTML(instructions) {
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${instructions.assemblyName} Instructions</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; border-bottom: 2px solid #eee; padding-bottom: 5px; }
    h3 { color: #888; }
    .section { margin-bottom: 30px; }
    .step { margin: 15px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #4CAF50; }
    .tip { background: #fff3cd; padding: 10px; border-left: 3px solid #ffc107; margin: 10px 0; }
    .materials li { margin: 5px 0; }
  </style>
</head>
<body>
  <h1>${instructions.assemblyName} - Crochet Instructions</h1>
  <p>Generated: ${new Date(instructions.generated).toLocaleDateString()}</p>
`;
    
    for (const section of instructions.sections) {
      html += `<div class="section">`;
      html += `<h2>${section.title}</h2>`;
      
      if (section.content) {
        html += this.renderHTMLContent(section.content);
      }
      
      if (section.steps) {
        for (const step of section.steps) {
          html += `<div class="step">`;
          html += `<h3>Step ${step.stepNumber || step.round || ''}: ${step.title || ''}</h3>`;
          html += `<p>${step.description || step.instruction || ''}</p>`;
          
          if (step.pattern) {
            html += `<p><strong>Pattern:</strong> ${step.pattern.join(', ')}</p>`;
          }
          
          if (step.tips && step.tips.length > 0) {
            html += `<div class="tip">💡 ${step.tips.join(' ')}</div>`;
          }
          
          html += `</div>`;
        }
      }
      
      html += `</div>`;
    }
    
    html += `</body></html>`;
    
    return html;
  }
  
  exportAsPDF(instructions) {
    // This would require a PDF library
    return {
      format: 'pdf',
      data: instructions,
      requiresLibrary: 'jsPDF or similar'
    };
  }
  
  exportAsMarkdown(instructions) {
    let md = `# ${instructions.assemblyName} - Crochet Instructions\n\n`;
    md += `*Generated: ${new Date(instructions.generated).toLocaleDateString()}*\n\n`;
    
    for (const section of instructions.sections) {
      md += `## ${section.title}\n\n`;
      
      if (section.content) {
        md += this.renderMarkdownContent(section.content) + '\n\n';
      }
      
      if (section.steps) {
        for (const step of section.steps) {
          md += `### ${step.title || `Step ${step.stepNumber || step.round}`}\n\n`;
          md += `${step.description || step.instruction || ''}\n\n`;
          
          if (step.pattern) {
            md += `**Pattern:** ${step.pattern.join(', ')}\n\n`;
          }
          
          if (step.tips && step.tips.length > 0) {
            md += `> 💡 **Tip:** ${step.tips.join(' ')}\n\n`;
          }
        }
      }
    }
    
    return md;
  }
  
  renderHTMLContent(content) {
    if (typeof content === 'string') {
      return `<p>${content}</p>`;
    }
    
    if (Array.isArray(content)) {
      return `<ul>${content.map(item => `<li>${item}</li>`).join('')}</ul>`;
    }
    
    if (typeof content === 'object') {
      let html = '';
      for (const [key, value] of Object.entries(content)) {
        if (Array.isArray(value)) {
          html += `<h4>${this.formatTitle(key)}</h4>`;
          html += `<ul>${value.map(item => `<li>${this.renderHTMLItem(item)}</li>`).join('')}</ul>`;
        } else {
          html += `<p><strong>${this.formatTitle(key)}:</strong> ${value}</p>`;
        }
      }
      return html;
    }
    
    return '';
  }
  
  renderMarkdownContent(content) {
    if (typeof content === 'string') {
      return content;
    }
    
    if (Array.isArray(content)) {
      return content.map(item => `- ${item}`).join('\n');
    }
    
    if (typeof content === 'object') {
      let md = '';
      for (const [key, value] of Object.entries(content)) {
        if (Array.isArray(value)) {
          md += `**${this.formatTitle(key)}:**\n`;
          md += value.map(item => `- ${this.renderMarkdownItem(item)}`).join('\n');
          md += '\n';
        } else {
          md += `**${this.formatTitle(key)}:** ${value}\n`;
        }
      }
      return md;
    }
    
    return '';
  }
  
  renderHTMLItem(item) {
    if (typeof item === 'string') {
      return item;
    }
    
    if (typeof item === 'object') {
      if (item.name && item.description) {
        return `<strong>${item.name}:</strong> ${item.description}`;
      }
      if (item.problem && item.solution) {
        return `<strong>Problem:</strong> ${item.problem}<br><strong>Solution:</strong> ${item.solution}`;
      }
      if (item.type && item.count) {
        return `${item.type}: ${item.count} pieces`;
      }
      if (item.abbreviation && item.name) {
        return `${item.abbreviation} = ${item.name}`;
      }
    }
    
    return JSON.stringify(item);
  }
  
  renderMarkdownItem(item) {
    if (typeof item === 'string') {
      return item;
    }
    
    if (typeof item === 'object') {
      if (item.name && item.description) {
        return `**${item.name}:** ${item.description}`;
      }
      if (item.problem && item.solution) {
        return `**Problem:** ${item.problem} → **Solution:** ${item.solution}`;
      }
      if (item.type && item.count) {
        return `${item.type}: ${item.count} pieces`;
      }
      if (item.abbreviation && item.name) {
        return `${item.abbreviation} = ${item.name}`;
      }
    }
    
    return JSON.stringify(item);
  }
  
  formatTitle(key) {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  }
}

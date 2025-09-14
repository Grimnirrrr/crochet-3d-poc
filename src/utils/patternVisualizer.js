// src/utils/patternVisualizer.js
// D16: Visual pattern charts and stitch diagrams

export class PatternVisualizer {
  constructor() {
    this.stitchSymbols = new Map();
    this.colorPalette = new Map();
    this.chartTypes = ['written', 'symbol', 'graph', 'diagram', '3d'];
    this.currentChartType = 'symbol';
    
    this.initializeSymbols();
    this.initializeColors();
    this.initializeChartGenerators();
  }
  
  initializeSymbols() {
    // Standard crochet symbols (US notation)
    this.stitchSymbols.set('ch', {
      symbol: '○',
      unicode: '\u25CB',
      svg: 'M5,10 L15,10',
      width: 20,
      height: 20,
      name: 'Chain',
      abbr: 'ch',
      color: '#666'
    });
    
    this.stitchSymbols.set('sl', {
      symbol: '•',
      unicode: '\u2022',
      svg: 'M10,10 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0',
      width: 20,
      height: 20,
      name: 'Slip Stitch',
      abbr: 'sl st',
      color: '#333'
    });
    
    this.stitchSymbols.set('sc', {
      symbol: 'X',
      unicode: '\u00D7',
      svg: 'M5,5 L15,15 M15,5 L5,15',
      width: 20,
      height: 20,
      name: 'Single Crochet',
      abbr: 'sc',
      color: '#2196F3'
    });
    
    this.stitchSymbols.set('hdc', {
      symbol: 'T',
      unicode: '\u22A5',
      svg: 'M10,5 L10,15 M5,5 L15,5',
      width: 20,
      height: 20,
      name: 'Half Double Crochet',
      abbr: 'hdc',
      color: '#4CAF50'
    });
    
    this.stitchSymbols.set('dc', {
      symbol: '†',
      unicode: '\u2020',
      svg: 'M10,3 L10,17 M5,7 L15,7',
      width: 20,
      height: 25,
      name: 'Double Crochet',
      abbr: 'dc',
      color: '#FF9800'
    });
    
    this.stitchSymbols.set('tr', {
      symbol: '‡',
      unicode: '\u2021',
      svg: 'M10,3 L10,17 M5,6 L15,6 M5,10 L15,10',
      width: 20,
      height: 30,
      name: 'Treble Crochet',
      abbr: 'tr',
      color: '#9C27B0'
    });
    
    this.stitchSymbols.set('inc', {
      symbol: 'V',
      unicode: '\u039B',
      svg: 'M5,15 L10,5 L15,15',
      width: 25,
      height: 20,
      name: 'Increase',
      abbr: 'inc',
      color: '#4CAF50'
    });
    
    this.stitchSymbols.set('dec', {
      symbol: 'A',
      unicode: '\u0394',
      svg: 'M5,5 L10,15 L15,5',
      width: 25,
      height: 20,
      name: 'Decrease',
      abbr: 'dec',
      color: '#F44336'
    });
    
    this.stitchSymbols.set('MR', {
      symbol: '⊙',
      unicode: '\u2299',
      svg: 'M10,10 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0 M10,10 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0',
      width: 25,
      height: 25,
      name: 'Magic Ring',
      abbr: 'MR',
      color: '#E91E63'
    });
    
    this.stitchSymbols.set('FO', {
      symbol: '◾',
      unicode: '\u25FE',
      svg: 'M5,5 L15,5 L15,15 L5,15 Z',
      width: 20,
      height: 20,
      name: 'Fasten Off',
      abbr: 'FO',
      color: '#795548'
    });
    
    this.stitchSymbols.set('turn', {
      symbol: '↻',
      unicode: '\u21BB',
      svg: 'M15,10 A5,5 0 1,1 10,5 L10,8 L14,4 L10,0',
      width: 20,
      height: 20,
      name: 'Turn',
      abbr: 'turn',
      color: '#607D8B'
    });
    
    this.stitchSymbols.set('join', {
      symbol: '⊕',
      unicode: '\u2295',
      svg: 'M10,10 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M4,10 L16,10 M10,4 L10,16',
      width: 20,
      height: 20,
      name: 'Join',
      abbr: 'join',
      color: '#00BCD4'
    });
  }
  
  initializeColors() {
    // Default color palette for yarn colors
    this.colorPalette.set('main', '#FF6B6B');
    this.colorPalette.set('contrast', '#4ECDC4');
    this.colorPalette.set('accent', '#45B7D1');
    this.colorPalette.set('neutral', '#95A5A6');
    this.colorPalette.set('light', '#F7F7F7');
    this.colorPalette.set('dark', '#2C3E50');
  }
  
  initializeChartGenerators() {
    this.chartGenerators = {
      written: (pattern) => this.generateWrittenChart(pattern),
      symbol: (pattern) => this.generateSymbolChart(pattern),
      graph: (pattern) => this.generateGraphChart(pattern),
      diagram: (pattern) => this.generateDiagram(pattern),
      '3d': (pattern) => this.generate3DVisualization(pattern)
    };
  }
  
  // ==================== MAIN VISUALIZATION ====================
  
  visualizePattern(pattern, options = {}) {
    const {
      type = this.currentChartType,
      colors = {},
      showCounts = true,
      showLegend = true,
      interactive = false,
      size = 'medium'
    } = options;
    
    // Merge custom colors with defaults
    const finalColors = { ...Object.fromEntries(this.colorPalette), ...colors };
    
    // Generate the appropriate chart
    const generator = this.chartGenerators[type];
    if (!generator) {
      throw new Error(`Unknown chart type: ${type}`);
    }
    
    const chart = generator(pattern);
    
    // Add metadata
    chart.metadata = {
      type,
      patternLength: pattern.length,
      uniqueStitches: this.countUniqueStitches(pattern),
      estimatedSize: this.estimateSize(pattern),
      difficulty: this.assessDifficulty(pattern)
    };
    
    // Add interactive features if requested
    if (interactive) {
      chart.interactive = this.addInteractiveFeatures(chart, pattern);
    }
    
    // Add legend if requested
    if (showLegend) {
      chart.legend = this.generateLegend(pattern);
    }
    
    // Add stitch counts if requested
    if (showCounts) {
      chart.counts = this.generateStitchCounts(pattern);
    }
    
    return chart;
  }
  
  // ==================== CHART GENERATORS ====================
  
  generateWrittenChart(pattern) {
    const rounds = this.groupIntoRounds(pattern);
    const chart = {
      type: 'written',
      title: 'Written Pattern',
      rounds: []
    };
    
    rounds.forEach((round, index) => {
      const roundData = {
        number: index + 1,
        stitches: round,
        written: this.convertToWritten(round),
        count: this.calculateStitchCount(round),
        repeat: this.findRepeat(round)
      };
      
      chart.rounds.push(roundData);
    });
    
    chart.totalStitches = chart.rounds.reduce((sum, r) => sum + r.count, 0);
    
    return chart;
  }
  
  generateSymbolChart(pattern) {
    const rounds = this.groupIntoRounds(pattern);
    const chart = {
      type: 'symbol',
      title: 'Symbol Chart',
      svg: this.createSVGChart(rounds),
      rounds: []
    };
    
    rounds.forEach((round, rIndex) => {
      const symbols = round.map(stitch => {
        const symbol = this.stitchSymbols.get(stitch);
        return {
          stitch,
          symbol: symbol?.symbol || '?',
          unicode: symbol?.unicode || stitch,
          color: symbol?.color || '#666'
        };
      });
      
      chart.rounds.push({
        number: rIndex + 1,
        symbols,
        arrangement: this.calculateArrangement(rIndex, round.length)
      });
    });
    
    return chart;
  }
  
  generateGraphChart(pattern) {
    const rounds = this.groupIntoRounds(pattern);
    const maxStitches = Math.max(...rounds.map(r => r.length));
    
    const chart = {
      type: 'graph',
      title: 'Graph Chart',
      width: maxStitches,
      height: rounds.length,
      grid: []
    };
    
    // Create grid
    rounds.forEach((round, rIndex) => {
      const row = [];
      const padding = Math.floor((maxStitches - round.length) / 2);
      
      // Add padding
      for (let i = 0; i < padding; i++) {
        row.push({ type: 'empty', symbol: '' });
      }
      
      // Add stitches
      round.forEach(stitch => {
        const symbol = this.stitchSymbols.get(stitch);
        row.push({
          type: 'stitch',
          stitch,
          symbol: symbol?.symbol || stitch,
          color: symbol?.color || '#666'
        });
      });
      
      // Add trailing padding
      while (row.length < maxStitches) {
        row.push({ type: 'empty', symbol: '' });
      }
      
      chart.grid.unshift(row); // Add at beginning to build from bottom up
    });
    
    return chart;
  }
  
  generateDiagram(pattern) {
    const rounds = this.groupIntoRounds(pattern);
    
    const diagram = {
      type: 'diagram',
      title: 'Stitch Diagram',
      elements: [],
      connections: []
    };
    
    let elementId = 0;
    let previousRound = [];
    
    rounds.forEach((round, rIndex) => {
      const currentRound = [];
      const radius = 50 + (rIndex * 30);
      const angleStep = (2 * Math.PI) / round.length;
      
      round.forEach((stitch, sIndex) => {
        const angle = sIndex * angleStep - Math.PI / 2; // Start at top
        const x = 200 + Math.cos(angle) * radius;
        const y = 200 + Math.sin(angle) * radius;
        
        const element = {
          id: elementId++,
          stitch,
          round: rIndex + 1,
          position: { x, y },
          symbol: this.stitchSymbols.get(stitch)?.symbol || stitch,
          color: this.stitchSymbols.get(stitch)?.color || '#666'
        };
        
        diagram.elements.push(element);
        currentRound.push(element);
        
        // Connect to previous round
        if (previousRound.length > 0) {
          const prevIndex = Math.floor(sIndex * previousRound.length / round.length);
          diagram.connections.push({
            from: previousRound[prevIndex].id,
            to: element.id,
            type: 'worked-into'
          });
        }
      });
      
      // Connect within round
      currentRound.forEach((element, index) => {
        const nextIndex = (index + 1) % currentRound.length;
        diagram.connections.push({
          from: element.id,
          to: currentRound[nextIndex].id,
          type: 'next-stitch'
        });
      });
      
      previousRound = currentRound;
    });
    
    return diagram;
  }
  
  generate3DVisualization(pattern) {
    const rounds = this.groupIntoRounds(pattern);
    
    const visualization = {
      type: '3d',
      title: '3D Pattern Visualization',
      layers: [],
      mesh: {
        vertices: [],
        faces: [],
        colors: []
      }
    };
    
    let vertexIndex = 0;
    
    rounds.forEach((round, rIndex) => {
      const layer = {
        round: rIndex + 1,
        height: rIndex * 10,
        points: []
      };
      
      const radius = this.calculateRadius(round, rIndex);
      const angleStep = (2 * Math.PI) / round.length;
      
      round.forEach((stitch, sIndex) => {
        const angle = sIndex * angleStep;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = rIndex * 10;
        
        visualization.mesh.vertices.push({ x, y, z });
        visualization.mesh.colors.push(
          this.stitchSymbols.get(stitch)?.color || '#666'
        );
        
        layer.points.push({
          stitch,
          position: { x, y, z },
          vertexIndex: vertexIndex++
        });
      });
      
      visualization.layers.push(layer);
    });
    
    // Generate faces (connect vertices)
    for (let l = 0; l < visualization.layers.length - 1; l++) {
      const currentLayer = visualization.layers[l];
      const nextLayer = visualization.layers[l + 1];
      
      for (let i = 0; i < currentLayer.points.length; i++) {
        const nextI = (i + 1) % currentLayer.points.length;
        const topI = i % nextLayer.points.length;
        const topNextI = (i + 1) % nextLayer.points.length;
        
        // Create quad face (as two triangles)
        visualization.mesh.faces.push([
          currentLayer.points[i].vertexIndex,
          currentLayer.points[nextI].vertexIndex,
          nextLayer.points[topI].vertexIndex
        ]);
        
        visualization.mesh.faces.push([
          currentLayer.points[nextI].vertexIndex,
          nextLayer.points[topNextI].vertexIndex,
          nextLayer.points[topI].vertexIndex
        ]);
      }
    }
    
    return visualization;
  }
  
  // ==================== HELPER METHODS ====================
  
  createSVGChart(rounds) {
    const size = 400;
    const center = size / 2;
    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="${size}" height="${size}" fill="#f9f9f9"/>`;
    
    // Draw rounds
    rounds.forEach((round, rIndex) => {
      const radius = 30 + (rIndex * 25);
      const angleStep = (2 * Math.PI) / round.length;
      
      round.forEach((stitch, sIndex) => {
        const angle = sIndex * angleStep - Math.PI / 2;
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        
        const symbol = this.stitchSymbols.get(stitch);
        if (symbol) {
          // Draw symbol
          svg += `<g transform="translate(${x - 10}, ${y - 10})">`;
          svg += `<path d="${symbol.svg}" stroke="${symbol.color}" stroke-width="2" fill="none"/>`;
          svg += `</g>`;
        } else {
          // Draw placeholder
          svg += `<circle cx="${x}" cy="${y}" r="5" fill="#999"/>`;
        }
      });
      
      // Draw round circle
      svg += `<circle cx="${center}" cy="${center}" r="${radius}" stroke="#ddd" stroke-width="1" fill="none"/>`;
    });
    
    // Center point
    svg += `<circle cx="${center}" cy="${center}" r="3" fill="#333"/>`;
    
    svg += `</svg>`;
    return svg;
  }
  
  groupIntoRounds(pattern) {
    const rounds = [];
    let currentRound = [];
    let isFirstRound = true;
    
    for (const stitch of pattern) {
      currentRound.push(stitch);
      
      // Detect round end
      if (stitch === 'join' || stitch === 'sl' || 
          (isFirstRound && stitch === 'MR' && currentRound.length > 1)) {
        rounds.push([...currentRound]);
        currentRound = [];
        isFirstRound = false;
      } else if (currentRound.length >= 6 && !isFirstRound) {
        // Default round size
        rounds.push([...currentRound]);
        currentRound = [];
      }
    }
    
    // Add remaining stitches
    if (currentRound.length > 0) {
      rounds.push(currentRound);
    }
    
    return rounds;
  }
  
  convertToWritten(round) {
    const written = [];
    let current = { stitch: round[0], count: 1 };
    
    for (let i = 1; i < round.length; i++) {
      if (round[i] === current.stitch) {
        current.count++;
      } else {
        written.push(current.count > 1 ? 
          `${current.count}${current.stitch}` : 
          current.stitch
        );
        current = { stitch: round[i], count: 1 };
      }
    }
    
    written.push(current.count > 1 ? 
      `${current.count}${current.stitch}` : 
      current.stitch
    );
    
    return written.join(', ');
  }
  
  calculateStitchCount(round) {
    let count = 0;
    
    for (const stitch of round) {
      if (stitch === 'inc') {
        count += 2;
      } else if (stitch === 'dec') {
        count -= 1;
      } else if (!['ch', 'turn', 'join', 'FO'].includes(stitch)) {
        count += 1;
      }
    }
    
    return Math.max(0, count);
  }
  
  findRepeat(round) {
    // Find repeating pattern in round
    for (let len = 1; len <= round.length / 2; len++) {
      const pattern = round.slice(0, len);
      let matches = true;
      
      for (let i = len; i < round.length; i += len) {
        const segment = round.slice(i, i + len);
        if (segment.length !== pattern.length || 
            !segment.every((s, idx) => s === pattern[idx])) {
          matches = false;
          break;
        }
      }
      
      if (matches && round.length % len === 0) {
        return {
          pattern,
          repeats: round.length / len
        };
      }
    }
    
    return null;
  }
  
  calculateArrangement(roundIndex, stitchCount) {
    return {
      radius: 50 + (roundIndex * 30),
      angleStep: 360 / stitchCount,
      startAngle: -90 // Start at top
    };
  }
  
  calculateRadius(round, roundIndex) {
    const baseRadius = 20;
    const expansion = this.calculateExpansion(round);
    return baseRadius + (roundIndex * 15) + (expansion * 5);
  }
  
  calculateExpansion(round) {
    let expansion = 0;
    
    for (const stitch of round) {
      if (stitch === 'inc') expansion += 1;
      if (stitch === 'dec') expansion -= 0.5;
    }
    
    return expansion;
  }
  
  countUniqueStitches(pattern) {
    return new Set(pattern).size;
  }
  
  estimateSize(pattern) {
    const rounds = this.groupIntoRounds(pattern);
    const finalRound = rounds[rounds.length - 1] || [];
    const circumference = finalRound.length * 0.5; // Rough estimate in cm
    const height = rounds.length * 0.8; // Rough estimate in cm
    
    return {
      circumference: `${circumference.toFixed(1)} cm`,
      height: `${height.toFixed(1)} cm`,
      rounds: rounds.length
    };
  }
  
  assessDifficulty(pattern) {
    let maxDifficulty = 1;
    
    for (const stitch of pattern) {
      const symbol = this.stitchSymbols.get(stitch);
      if (stitch === 'MR') maxDifficulty = Math.max(maxDifficulty, 3);
      else if (['tr', 'dtr'].includes(stitch)) maxDifficulty = Math.max(maxDifficulty, 3);
      else if (['inc', 'dec', 'dc'].includes(stitch)) maxDifficulty = Math.max(maxDifficulty, 2);
    }
    
    if (maxDifficulty === 1) return 'beginner';
    if (maxDifficulty === 2) return 'intermediate';
    return 'advanced';
  }
  
  generateLegend(pattern) {
    const usedStitches = new Set(pattern);
    const legend = [];
    
    for (const stitch of usedStitches) {
      const symbol = this.stitchSymbols.get(stitch);
      if (symbol) {
        legend.push({
          stitch,
          symbol: symbol.symbol,
          unicode: symbol.unicode,
          name: symbol.name,
          abbr: symbol.abbr,
          color: symbol.color
        });
      }
    }
    
    return legend.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  generateStitchCounts(pattern) {
    const counts = new Map();
    
    for (const stitch of pattern) {
      counts.set(stitch, (counts.get(stitch) || 0) + 1);
    }
    
    return {
      total: pattern.length,
      byStitch: Object.fromEntries(counts),
      percentage: Object.fromEntries(
        Array.from(counts).map(([stitch, count]) => [
          stitch,
          ((count / pattern.length) * 100).toFixed(1) + '%'
        ])
      )
    };
  }
  
  addInteractiveFeatures(chart, pattern) {
    return {
      hover: 'Show stitch details on hover',
      click: 'Highlight connected stitches',
      zoom: 'Zoom in/out of chart',
      rotate: '3D rotation for 3D charts',
      edit: 'Click to edit stitch'
    };
  }
  
  // ==================== EXPORT METHODS ====================
  
  exportChart(chart, format = 'svg') {
    switch (format) {
      case 'svg':
        return this.exportAsSVG(chart);
      case 'png':
        return this.exportAsPNG(chart);
      case 'pdf':
        return this.exportAsPDF(chart);
      case 'json':
        return JSON.stringify(chart, null, 2);
      default:
        return chart;
    }
  }
  
  exportAsSVG(chart) {
    if (chart.svg) {
      return chart.svg;
    }
    
    // Generate SVG from chart data
    return this.createSVGFromChart(chart);
  }
  
  exportAsPNG(chart) {
    // Would require canvas conversion
    return {
      format: 'png',
      data: chart,
      requiresCanvas: true
    };
  }
  
  exportAsPDF(chart) {
    // Would require PDF library
    return {
      format: 'pdf',
      data: chart,
      requiresLibrary: 'jsPDF'
    };
  }
  
  createSVGFromChart(chart) {
    // Generate SVG based on chart type
    if (chart.type === 'symbol') {
      return chart.svg || this.createSVGChart(chart.rounds);
    }
    
    // Default SVG representation
    return `<svg width="400" height="400"><text x="200" y="200" text-anchor="middle">Chart: ${chart.title}</text></svg>`;
  }
}

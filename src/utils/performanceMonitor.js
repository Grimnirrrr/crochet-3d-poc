// src/utils/performanceMonitor.js
// D13: Real-time performance tracking and optimization

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.history = [];
    this.thresholds = new Map();
    this.alerts = [];
    this.optimizationSuggestions = [];
    this.isMonitoring = false;
    this.sampleInterval = 100; // ms
    this.maxHistorySize = 1000;
    this.intervalId = null;
    
    this.initializeMetrics();
    this.initializeThresholds();
  }
  
  initializeMetrics() {
    // Frame rate metrics
    this.metrics.set('fps', {
      current: 0,
      average: 0,
      min: Infinity,
      max: 0,
      samples: [],
      lastTime: performance.now()
    });
    
    // Memory metrics
    this.metrics.set('memory', {
      used: 0,
      total: 0,
      percent: 0,
      heapUsed: 0,
      heapTotal: 0,
      samples: []
    });
    
    // Render metrics
    this.metrics.set('render', {
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      materials: 0,
      textures: 0,
      renderTime: 0,
      samples: []
    });
    
    // Assembly metrics
    this.metrics.set('assembly', {
      pieceCount: 0,
      connectionCount: 0,
      groupCount: 0,
      complexity: 0,
      updateTime: 0,
      samples: []
    });
    
    // Interaction metrics
    this.metrics.set('interaction', {
      responseTime: 0,
      inputLag: 0,
      eventCount: 0,
      queuedEvents: 0,
      samples: []
    });
    
    // Network metrics (for future online features)
    this.metrics.set('network', {
      latency: 0,
      bandwidth: 0,
      requestCount: 0,
      pendingRequests: 0,
      samples: []
    });
  }
  
  initializeThresholds() {
    // Define performance thresholds
    this.thresholds.set('fps', {
      critical: 15,
      warning: 30,
      good: 60
    });
    
    this.thresholds.set('memory', {
      critical: 90, // percent
      warning: 75,
      good: 50
    });
    
    this.thresholds.set('renderTime', {
      critical: 50, // ms
      warning: 33,
      good: 16
    });
    
    this.thresholds.set('pieceCount', {
      critical: 1000,
      warning: 500,
      good: 100
    });
    
    this.thresholds.set('responseTime', {
      critical: 200, // ms
      warning: 100,
      good: 50
    });
  }
  
  // Start monitoring
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    
    // Start sampling interval
    this.intervalId = setInterval(() => {
      this.sample();
    }, this.sampleInterval);
    
    // Start frame monitoring
    this.monitorFrames();
    
    return {
      status: 'monitoring',
      interval: this.sampleInterval
    };
  }
  
  // Stop monitoring
  stop() {
    this.isMonitoring = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.frameRequestId) {
      cancelAnimationFrame(this.frameRequestId);
      this.frameRequestId = null;
    }
    
    return {
      status: 'stopped',
      summary: this.getSummary()
    };
  }
  
  // Monitor frame rate
  monitorFrames() {
    if (!this.isMonitoring) return;
    
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    const fps = 1000 / delta;
    const fpsMetric = this.metrics.get('fps');
    
    fpsMetric.current = fps;
    fpsMetric.samples.push(fps);
    
    // Keep only recent samples
    if (fpsMetric.samples.length > 60) {
      fpsMetric.samples.shift();
    }
    
    // Update statistics
    fpsMetric.average = fpsMetric.samples.reduce((a, b) => a + b, 0) / fpsMetric.samples.length;
    fpsMetric.min = Math.min(fpsMetric.min, fps);
    fpsMetric.max = Math.max(fpsMetric.max, fps);
    
    // Check for performance issues
    this.checkThreshold('fps', fps);
    
    // Continue monitoring
    this.frameRequestId = requestAnimationFrame(() => this.monitorFrames());
  }
  
  // Sample all metrics
  sample() {
    const timestamp = Date.now();
    
    // Sample memory if available
    if (performance.memory) {
      this.sampleMemory();
    }
    
    // Sample render stats (would connect to Three.js renderer)
    this.sampleRender();
    
    // Record sample
    const sample = {
      timestamp,
      fps: this.metrics.get('fps').current,
      memory: this.metrics.get('memory').percent,
      renderTime: this.metrics.get('render').renderTime,
      pieceCount: this.metrics.get('assembly').pieceCount
    };
    
    this.history.push(sample);
    
    // Trim history
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    // Check for issues
    this.analyzePerformance();
  }
  
  // Sample memory usage
  sampleMemory() {
    if (!performance.memory) return;
    
    const memoryMetric = this.metrics.get('memory');
    
    memoryMetric.heapUsed = performance.memory.usedJSHeapSize;
    memoryMetric.heapTotal = performance.memory.totalJSHeapSize;
    memoryMetric.total = performance.memory.jsHeapSizeLimit;
    
    memoryMetric.used = memoryMetric.heapUsed;
    memoryMetric.percent = (memoryMetric.heapUsed / memoryMetric.heapTotal) * 100;
    
    memoryMetric.samples.push(memoryMetric.percent);
    if (memoryMetric.samples.length > 60) {
      memoryMetric.samples.shift();
    }
    
    this.checkThreshold('memory', memoryMetric.percent);
  }
  
  // Sample render statistics
  sampleRender() {
    const renderMetric = this.metrics.get('render');
    
    // These would be populated from Three.js renderer.info
    // Simulated for testing
    renderMetric.samples.push(renderMetric.renderTime);
    if (renderMetric.samples.length > 60) {
      renderMetric.samples.shift();
    }
  }
  
  // Update metrics from external sources
  updateMetric(category, data) {
    const metric = this.metrics.get(category);
    if (!metric) return;
    
    Object.assign(metric, data);
    
    // Special handling for assembly metrics
    if (category === 'assembly') {
      this.checkThreshold('pieceCount', data.pieceCount);
      this.generateOptimizationSuggestions(data);
    }
    
    // Special handling for render metrics
    if (category === 'render') {
      this.checkThreshold('renderTime', data.renderTime);
    }
  }
  
  // Check threshold and create alerts
  checkThreshold(metricName, value) {
    const threshold = this.thresholds.get(metricName);
    if (!threshold) return;
    
    let level = 'good';
    let message = '';
    
    if (metricName === 'fps') {
      // FPS is inverse - lower is worse
      if (value < threshold.critical) {
        level = 'critical';
        message = `FPS critically low: ${value.toFixed(1)}`;
      } else if (value < threshold.warning) {
        level = 'warning';
        message = `FPS below target: ${value.toFixed(1)}`;
      }
    } else {
      // Higher values are worse for other metrics
      if (value > threshold.critical) {
        level = 'critical';
        message = `${metricName} critical: ${value.toFixed(1)}`;
      } else if (value > threshold.warning) {
        level = 'warning';
        message = `${metricName} warning: ${value.toFixed(1)}`;
      }
    }
    
    if (level !== 'good') {
      this.addAlert({
        level,
        metric: metricName,
        value,
        message,
        timestamp: Date.now()
      });
    }
  }
  
  // Add performance alert
  addAlert(alert) {
    // Avoid duplicate alerts
    const existing = this.alerts.find(a => 
      a.metric === alert.metric && 
      a.level === alert.level &&
      Date.now() - a.timestamp < 5000 // Within 5 seconds
    );
    
    if (!existing) {
      this.alerts.push(alert);
      
      // Keep only recent alerts
      this.alerts = this.alerts.filter(a => 
        Date.now() - a.timestamp < 60000 // Last minute
      );
    }
  }
  
  // Analyze performance and generate suggestions
  analyzePerformance() {
    const suggestions = [];
    const fps = this.metrics.get('fps');
    const memory = this.metrics.get('memory');
    const assembly = this.metrics.get('assembly');
    const render = this.metrics.get('render');
    
    // FPS optimization suggestions
    if (fps.average < 30) {
      suggestions.push({
        type: 'fps',
        priority: 'high',
        title: 'Low Frame Rate Detected',
        description: `Average FPS: ${fps.average.toFixed(1)}`,
        suggestions: [
          'Reduce piece count',
          'Simplify geometries',
          'Disable unnecessary visual effects',
          'Use level-of-detail (LOD) for distant pieces'
        ]
      });
    }
    
    // Memory optimization suggestions
    if (memory.percent > 75) {
      suggestions.push({
        type: 'memory',
        priority: memory.percent > 90 ? 'critical' : 'high',
        title: 'High Memory Usage',
        description: `Memory: ${memory.percent.toFixed(1)}%`,
        suggestions: [
          'Remove unused pieces',
          'Clear undo history',
          'Dispose of unused materials and geometries',
          'Reduce texture sizes'
        ]
      });
    }
    
    // Assembly complexity suggestions
    if (assembly.pieceCount > 500) {
      suggestions.push({
        type: 'complexity',
        priority: 'medium',
        title: 'Complex Assembly',
        description: `${assembly.pieceCount} pieces`,
        suggestions: [
          'Consider grouping related pieces',
          'Use instances for repeated pieces',
          'Implement view frustum culling',
          'Archive completed sections'
        ]
      });
    }
    
    // Render optimization suggestions
    if (render.drawCalls > 100) {
      suggestions.push({
        type: 'render',
        priority: 'medium',
        title: 'High Draw Call Count',
        description: `${render.drawCalls} draw calls`,
        suggestions: [
          'Batch similar geometries',
          'Use instanced rendering',
          'Merge static meshes',
          'Reduce material variety'
        ]
      });
    }
    
    this.optimizationSuggestions = suggestions;
  }
  
  // Generate optimization suggestions based on assembly data
  generateOptimizationSuggestions(assemblyData) {
    const suggestions = [];
    
    if (assemblyData.pieceCount > 100 && assemblyData.groupCount < 5) {
      suggestions.push({
        type: 'organization',
        priority: 'low',
        title: 'Consider Grouping',
        description: 'Large number of ungrouped pieces',
        action: 'group-similar'
      });
    }
    
    if (assemblyData.complexity > 1000) {
      suggestions.push({
        type: 'simplification',
        priority: 'medium',
        title: 'Simplify Assembly',
        description: 'High complexity score',
        action: 'simplify-patterns'
      });
    }
    
    return suggestions;
  }
  
  // Get current performance status
  getStatus() {
    const fps = this.metrics.get('fps');
    const memory = this.metrics.get('memory');
    
    let overall = 'good';
    
    if (fps.average < 15 || memory.percent > 90) {
      overall = 'critical';
    } else if (fps.average < 30 || memory.percent > 75) {
      overall = 'warning';
    }
    
    return {
      overall,
      fps: {
        current: fps.current,
        average: fps.average,
        status: this.getMetricStatus('fps', fps.current)
      },
      memory: {
        percent: memory.percent,
        used: this.formatBytes(memory.used),
        status: this.getMetricStatus('memory', memory.percent)
      },
      monitoring: this.isMonitoring
    };
  }
  
  // Get metric status
  getMetricStatus(metricName, value) {
    const threshold = this.thresholds.get(metricName);
    if (!threshold) return 'unknown';
    
    if (metricName === 'fps') {
      if (value < threshold.critical) return 'critical';
      if (value < threshold.warning) return 'warning';
      return 'good';
    } else {
      if (value > threshold.critical) return 'critical';
      if (value > threshold.warning) return 'warning';
      return 'good';
    }
  }
  
  // Get performance summary
  getSummary() {
    const fps = this.metrics.get('fps');
    const memory = this.metrics.get('memory');
    const assembly = this.metrics.get('assembly');
    
    return {
      monitoring: this.isMonitoring,
      duration: this.history.length * this.sampleInterval,
      fps: {
        average: fps.average,
        min: fps.min,
        max: fps.max
      },
      memory: {
        average: memory.samples.reduce((a, b) => a + b, 0) / (memory.samples.length || 1),
        peak: Math.max(...memory.samples, 0)
      },
      assembly: {
        pieces: assembly.pieceCount,
        connections: assembly.connectionCount,
        complexity: assembly.complexity
      },
      alerts: this.alerts.length,
      suggestions: this.optimizationSuggestions.length
    };
  }
  
  // Get history for charts
  getHistory(metricName, limit = 100) {
    const recent = this.history.slice(-limit);
    
    return recent.map(sample => ({
      timestamp: sample.timestamp,
      value: sample[metricName] || 0
    }));
  }
  
  // Get all metrics
  getAllMetrics() {
    const result = {};
    
    for (const [key, metric] of this.metrics) {
      result[key] = {
        ...metric,
        samples: undefined // Don't include raw samples
      };
    }
    
    return result;
  }
  
  // Clear history and reset metrics
  reset() {
    this.history = [];
    this.alerts = [];
    this.optimizationSuggestions = [];
    
    for (const metric of this.metrics.values()) {
      metric.samples = [];
      if (metric.min !== undefined) metric.min = Infinity;
      if (metric.max !== undefined) metric.max = 0;
      if (metric.average !== undefined) metric.average = 0;
    }
    
    return { status: 'reset' };
  }
  
  // Utility functions
  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
  
  // Export performance report
  exportReport() {
    return {
      timestamp: new Date().toISOString(),
      status: this.getStatus(),
      summary: this.getSummary(),
      metrics: this.getAllMetrics(),
      alerts: this.alerts,
      suggestions: this.optimizationSuggestions,
      history: {
        samples: this.history.length,
        duration: this.history.length * this.sampleInterval,
        data: this.history.slice(-100) // Last 100 samples
      }
    };
  }
}

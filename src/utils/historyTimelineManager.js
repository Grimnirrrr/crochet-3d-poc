// src/utils/historyTimelineManager.js
// D9: Visual history timeline for assembly actions

import { toSafeVector3 } from './safeTypes';

export class HistoryTimelineManager {
  constructor(undoRedoSystem) {
    this.undoRedoSystem = undoRedoSystem;
    
    // Timeline configuration
    this.config = {
      displayMode: 'compact', // 'compact', 'detailed', 'graph'
      timeRange: 'all', // 'all', 'session', 'recent'
      groupSimilar: true,
      showThumbnails: false,
      animateTransitions: true
    };
    
    // Timeline data
    this.timeline = [];
    this.sessions = [];
    this.milestones = [];
    this.bookmarks = new Set();
    
    // Filtering
    this.filters = {
      actionTypes: new Set(),
      dateRange: null,
      searchTerm: '',
      showOnlyBookmarked: false
    };
    
    // Statistics
    this.stats = {
      totalTime: 0,
      averageTimeBetweenActions: 0,
      mostCommonAction: null,
      actionFrequency: new Map(),
      sessionCount: 0
    };
    
    // Callbacks
    this.callbacks = {
      onTimelineUpdate: null,
      onMilestoneReached: null,
      onSessionChange: null
    };
    
    this.currentSessionId = this.createSession();
    this.lastActionTime = Date.now();
    
    // Initialize from existing history
    if (undoRedoSystem) {
      this.syncWithUndoRedo();
    }
  }
  
  // Create a new session
  createSession() {
    const session = {
      id: `session_${Date.now()}`,
      startTime: Date.now(),
      endTime: null,
      actions: [],
      name: `Session ${this.sessions.length + 1}`
    };
    
    this.sessions.push(session);
    this.stats.sessionCount++;
    
    return session.id;
  }
  
  // Add action to timeline
  addAction(action) {
    const timelineEntry = {
      id: action.id || `timeline_${Date.now()}`,
      actionId: action.id,
      type: action.type,
      description: action.description,
      timestamp: action.timestamp || Date.now(),
      sessionId: this.currentSessionId,
      data: action.data,
      thumbnail: null,
      tags: this.generateTags(action),
      duration: Date.now() - this.lastActionTime
    };
    
    // Add to timeline
    this.timeline.push(timelineEntry);
    
    // Add to current session
    const session = this.sessions.find(s => s.id === this.currentSessionId);
    if (session) {
      session.actions.push(timelineEntry.id);
      session.endTime = timelineEntry.timestamp;
    }
    
    // Update statistics
    this.updateStatistics(timelineEntry);
    
    // Check for milestones
    this.checkMilestones(timelineEntry);
    
    // Group similar actions if enabled
    if (this.config.groupSimilar) {
      this.groupSimilarActions();
    }
    
    this.lastActionTime = timelineEntry.timestamp;
    
    // Trigger callback
    if (this.callbacks.onTimelineUpdate) {
      this.callbacks.onTimelineUpdate(this.getTimelineData());
    }
    
    return timelineEntry;
  }
  
  // Sync with undo/redo system
  syncWithUndoRedo() {
    if (!this.undoRedoSystem) return;
    
    const history = this.undoRedoSystem.history || [];
    const currentIndex = this.undoRedoSystem.currentIndex;
    
    // Clear and rebuild timeline
    this.timeline = [];
    
    history.forEach((action, index) => {
      const entry = this.addAction(action);
      entry.isCurrent = index === currentIndex;
      entry.isFuture = index > currentIndex;
    });
  }
  
  // Generate tags for action
  generateTags(action) {
    const tags = [];
    
    // Add type tag
    tags.push(action.type);
    
    // Add piece-specific tags
    if (action.data) {
      if (action.data.pieceId) tags.push(`piece:${action.data.pieceId}`);
      if (action.data.piece1Id) tags.push(`piece:${action.data.piece1Id}`);
      if (action.data.piece2Id) tags.push(`piece:${action.data.piece2Id}`);
    }
    
    // Add time-based tags
    const hour = new Date(action.timestamp).getHours();
    if (hour < 6) tags.push('late-night');
    else if (hour < 12) tags.push('morning');
    else if (hour < 18) tags.push('afternoon');
    else tags.push('evening');
    
    return tags;
  }
  
  // Group similar consecutive actions
  groupSimilarActions() {
    const grouped = [];
    let currentGroup = null;
    
    for (const entry of this.timeline) {
      if (currentGroup && 
          currentGroup.type === entry.type &&
          entry.timestamp - currentGroup.lastTimestamp < 5000) {
        // Add to current group
        currentGroup.entries.push(entry);
        currentGroup.lastTimestamp = entry.timestamp;
        currentGroup.count++;
      } else {
        // Start new group
        if (currentGroup) {
          grouped.push(currentGroup);
        }
        currentGroup = {
          id: `group_${entry.id}`,
          type: entry.type,
          entries: [entry],
          firstTimestamp: entry.timestamp,
          lastTimestamp: entry.timestamp,
          count: 1,
          expanded: false
        };
      }
    }
    
    if (currentGroup) {
      grouped.push(currentGroup);
    }
    
    this.groupedTimeline = grouped;
  }
  
  // Check for milestones
  checkMilestones(entry) {
    const milestones = [
      { count: 10, name: 'Getting Started', icon: '🌱' },
      { count: 50, name: 'Making Progress', icon: '📈' },
      { count: 100, name: 'Experienced Builder', icon: '🏗️' },
      { count: 500, name: 'Master Crafter', icon: '🏆' }
    ];
    
    const actionCount = this.timeline.length;
    
    for (const milestone of milestones) {
      if (actionCount === milestone.count) {
        const milestoneEntry = {
          id: `milestone_${milestone.count}`,
          name: milestone.name,
          icon: milestone.icon,
          timestamp: entry.timestamp,
          actionCount: milestone.count
        };
        
        this.milestones.push(milestoneEntry);
        
        if (this.callbacks.onMilestoneReached) {
          this.callbacks.onMilestoneReached(milestoneEntry);
        }
        
        break;
      }
    }
  }
  
  // Update statistics
  updateStatistics(entry) {
    // Update action frequency
    const count = this.stats.actionFrequency.get(entry.type) || 0;
    this.stats.actionFrequency.set(entry.type, count + 1);
    
    // Find most common action
    let maxCount = 0;
    let mostCommon = null;
    for (const [type, count] of this.stats.actionFrequency) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = type;
      }
    }
    this.stats.mostCommonAction = mostCommon;
    
    // Calculate average time between actions
    if (this.timeline.length > 1) {
      const totalDuration = this.timeline.reduce((sum, e) => sum + (e.duration || 0), 0);
      this.stats.averageTimeBetweenActions = totalDuration / this.timeline.length;
    }
    
    // Update total time
    const firstAction = this.timeline[0];
    const lastAction = this.timeline[this.timeline.length - 1];
    if (firstAction && lastAction) {
      this.stats.totalTime = lastAction.timestamp - firstAction.timestamp;
    }
  }
  
  // Get filtered timeline
  getFilteredTimeline() {
    let filtered = [...this.timeline];
    
    // Filter by action types
    if (this.filters.actionTypes.size > 0) {
      filtered = filtered.filter(entry => 
        this.filters.actionTypes.has(entry.type)
      );
    }
    
    // Filter by date range
    if (this.filters.dateRange) {
      const { start, end } = this.filters.dateRange;
      filtered = filtered.filter(entry =>
        entry.timestamp >= start && entry.timestamp <= end
      );
    }
    
    // Filter by search term
    if (this.filters.searchTerm) {
      const term = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.description.toLowerCase().includes(term) ||
        entry.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // Filter by bookmarks
    if (this.filters.showOnlyBookmarked) {
      filtered = filtered.filter(entry =>
        this.bookmarks.has(entry.id)
      );
    }
    
    return filtered;
  }
  
  // Toggle bookmark
  toggleBookmark(entryId) {
    if (this.bookmarks.has(entryId)) {
      this.bookmarks.delete(entryId);
    } else {
      this.bookmarks.add(entryId);
    }
    
    if (this.callbacks.onTimelineUpdate) {
      this.callbacks.onTimelineUpdate(this.getTimelineData());
    }
  }
  
  // Get timeline data
  getTimelineData() {
    const filtered = this.getFilteredTimeline();
    
    return {
      timeline: filtered,
      groupedTimeline: this.config.groupSimilar ? this.groupedTimeline : null,
      sessions: this.sessions,
      milestones: this.milestones,
      bookmarks: Array.from(this.bookmarks),
      stats: this.getStatistics(),
      currentSessionId: this.currentSessionId
    };
  }
  
  // Get statistics
  getStatistics() {
    const actionTypes = Array.from(this.stats.actionFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));
    
    return {
      ...this.stats,
      actionTypes,
      timelineLength: this.timeline.length,
      filteredLength: this.getFilteredTimeline().length,
      bookmarkCount: this.bookmarks.size,
      milestoneCount: this.milestones.length
    };
  }
  
  // Export timeline
  exportTimeline(format = 'json') {
    const data = {
      version: '1.0',
      exported: Date.now(),
      timeline: this.timeline,
      sessions: this.sessions,
      milestones: this.milestones,
      bookmarks: Array.from(this.bookmarks),
      statistics: this.getStatistics()
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(data.timeline);
    }
    
    return data;
  }
  
  // Convert timeline to CSV
  convertToCSV(timeline) {
    const headers = ['Timestamp', 'Type', 'Description', 'Duration (ms)', 'Session'];
    const rows = timeline.map(entry => [
      new Date(entry.timestamp).toISOString(),
      entry.type,
      entry.description,
      entry.duration || 0,
      entry.sessionId
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
  
  // Set callbacks
  setCallbacks(callbacks) {
    Object.assign(this.callbacks, callbacks);
  }
  
  // Clear timeline
  clear() {
    this.timeline = [];
    this.sessions = [];
    this.milestones = [];
    this.bookmarks.clear();
    this.currentSessionId = this.createSession();
    
    if (this.callbacks.onTimelineUpdate) {
      this.callbacks.onTimelineUpdate(this.getTimelineData());
    }
  }
}

export default HistoryTimelineManager;

// src/components/HistoryTimelineUI.jsx
// Visual timeline component for assembly history

import React, { useState } from 'react';

export function HistoryTimelineUI({
  timelineData = {},
  onJumpTo,
  onToggleBookmark,
  onFilterChange,
  onExport,
  onSessionRename,
  displayMode = 'compact'
}) {
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [selectedSession, setSelectedSession] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  const {
    timeline = [],
    groupedTimeline = [],
    sessions = [],
    milestones = [],
    bookmarks = [],
    stats = {},
    currentSessionId
  } = timelineData;
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };
  
  // Format duration
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };
  
  // Get action color
  const getActionColor = (type) => {
    const colors = {
      'add_piece': '#48bb78',
      'remove_piece': '#f56565',
      'move_piece': '#4299e1',
      'connect': '#9f7aea',
      'disconnect': '#ed8936',
      'modify_piece': '#38b2ac',
      'batch': '#ecc94b'
    };
    return colors[type] || '#718096';
  };
  
  // Toggle group expansion
  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };
  
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      width: '350px',
      maxHeight: '80vh',
      overflowY: 'auto',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 996,
      border: '1px solid #4a5568'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #4a5568'
      }}>
        <h3 style={{ 
          margin: 0,
          fontSize: '14px',
          color: '#cbd5e0'
        }}>
          📊 History Timeline
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '4px 8px',
              background: showFilters ? '#4a5568' : '#2d3748',
              color: '#cbd5e0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            🔍
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            style={{
              padding: '4px 8px',
              background: showStats ? '#4a5568' : '#2d3748',
              color: '#cbd5e0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            📈
          </button>
          <button
            onClick={() => onExport && onExport('json')}
            style={{
              padding: '4px 8px',
              background: '#2d3748',
              color: '#cbd5e0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            💾
          </button>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '11px', marginBottom: '8px', color: '#a0aec0' }}>
            Filters
          </div>
          <input
            type="text"
            placeholder="Search actions..."
            onChange={(e) => onFilterChange && onFilterChange({ searchTerm: e.target.value })}
            style={{
              width: '100%',
              padding: '6px',
              background: '#2d3748',
              color: 'white',
              border: '1px solid #4a5568',
              borderRadius: '4px',
              fontSize: '11px',
              marginBottom: '8px'
            }}
          />
          <label style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '11px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              onChange={(e) => onFilterChange && onFilterChange({ showOnlyBookmarked: e.target.checked })}
              style={{ marginRight: '6px' }}
            />
            Show only bookmarked
          </label>
        </div>
      )}
      
      {/* Statistics Panel */}
      {showStats && stats && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          background: 'rgba(66, 153, 225, 0.1)',
          borderRadius: '6px',
          border: '1px solid #4299e1'
        }}>
          <div style={{ fontSize: '11px', marginBottom: '8px', color: '#90cdf4' }}>
            Statistics
          </div>
          <div style={{ display: 'grid', gap: '4px', fontSize: '10px' }}>
            <div>Total actions: {stats.timelineLength || 0}</div>
            <div>Sessions: {stats.sessionCount || 0}</div>
            <div>Milestones: {stats.milestoneCount || 0}</div>
            <div>Bookmarks: {stats.bookmarkCount || 0}</div>
            {stats.mostCommonAction && (
              <div>Most common: {stats.mostCommonAction}</div>
            )}
            {stats.totalTime > 0 && (
              <div>Total time: {formatDuration(stats.totalTime)}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Sessions */}
      {sessions.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '11px', marginBottom: '8px', color: '#a0aec0' }}>
            Sessions
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(
                  selectedSession === session.id ? null : session.id
                )}
                style={{
                  padding: '4px 8px',
                  background: session.id === currentSessionId 
                    ? '#48bb78' 
                    : selectedSession === session.id 
                    ? '#4299e1' 
                    : '#2d3748',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                {session.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Milestones */}
      {milestones.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '11px', marginBottom: '8px', color: '#a0aec0' }}>
            Milestones
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {milestones.map(milestone => (
              <div
                key={milestone.id}
                style={{
                  padding: '6px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: '4px',
                  border: '1px solid #fbbf24',
                  fontSize: '10px'
                }}
              >
                <span style={{ marginRight: '4px' }}>{milestone.icon}</span>
                {milestone.name}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Timeline */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', marginBottom: '8px', color: '#a0aec0' }}>
          Timeline
        </div>
        
        {/* Display based on mode */}
        {displayMode === 'compact' && groupedTimeline && groupedTimeline.length > 0 ? (
          // Grouped view
          <div style={{ position: 'relative' }}>
            {groupedTimeline.map((group, index) => (
              <div key={group.id} style={{ marginBottom: '8px' }}>
                {group.count > 1 ? (
                  // Group header
                  <div
                    onClick={() => toggleGroup(group.id)}
                    style={{
                      padding: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      borderLeft: `3px solid ${getActionColor(group.type)}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <span style={{ color: getActionColor(group.type), marginRight: '8px' }}>
                          ●
                        </span>
                        {group.type} × {group.count}
                      </div>
                      <div style={{ fontSize: '10px', color: '#718096' }}>
                        {formatDuration(group.lastTimestamp - group.firstTimestamp)}
                        <span style={{ marginLeft: '8px' }}>
                          {expandedGroups.has(group.id) ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Expanded entries */}
                    {expandedGroups.has(group.id) && (
                      <div style={{ marginTop: '8px', paddingLeft: '12px' }}>
                        {group.entries.map(entry => (
                          <TimelineEntry
                            key={entry.id}
                            entry={entry}
                            isBookmarked={bookmarks.includes(entry.id)}
                            onJumpTo={onJumpTo}
                            onToggleBookmark={onToggleBookmark}
                            compact={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Single entry
                  <TimelineEntry
                    entry={group.entries[0]}
                    isBookmarked={bookmarks.includes(group.entries[0].id)}
                    onJumpTo={onJumpTo}
                    onToggleBookmark={onToggleBookmark}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          // Regular timeline view
          <div style={{ position: 'relative' }}>
            {timeline.map((entry, index) => (
              <TimelineEntry
                key={entry.id}
                entry={entry}
                isBookmarked={bookmarks.includes(entry.id)}
                onJumpTo={() => onJumpTo && onJumpTo(index)}
                onToggleBookmark={() => onToggleBookmark && onToggleBookmark(entry.id)}
              />
            ))}
          </div>
        )}
        
        {timeline.length === 0 && (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#718096',
            fontSize: '11px'
          }}>
            No actions in timeline
          </div>
        )}
      </div>
    </div>
  );
}

// Timeline entry component
function TimelineEntry({ entry, isBookmarked, onJumpTo, onToggleBookmark, compact = false }) {
  const getActionColor = (type) => {
    const colors = {
      'add_piece': '#48bb78',
      'remove_piece': '#f56565',
      'move_piece': '#4299e1',
      'connect': '#9f7aea',
      'disconnect': '#ed8936',
      'modify_piece': '#38b2ac',
      'batch': '#ecc94b'
    };
    return colors[type] || '#718096';
  };
  
  return (
    <div style={{
      padding: compact ? '4px' : '8px',
      marginBottom: '6px',
      background: entry.isCurrent 
        ? 'rgba(66, 153, 225, 0.2)' 
        : entry.isFuture
        ? 'rgba(255, 255, 255, 0.02)'
        : 'rgba(255, 255, 255, 0.05)',
      borderRadius: '4px',
      borderLeft: `3px solid ${getActionColor(entry.type)}`,
      opacity: entry.isFuture ? 0.5 : 1,
      fontSize: compact ? '10px' : '11px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div 
          onClick={onJumpTo}
          style={{ 
            cursor: 'pointer',
            flex: 1
          }}
        >
          <span style={{ color: getActionColor(entry.type), marginRight: '6px' }}>
            ●
          </span>
          {entry.description}
        </div>
        <button
          onClick={onToggleBookmark}
          style={{
            background: 'none',
            border: 'none',
            color: isBookmarked ? '#fbbf24' : '#4a5568',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>
      {!compact && (
        <div style={{
          fontSize: '9px',
          color: '#718096',
          marginTop: '2px',
          marginLeft: '12px'
        }}>
          {new Date(entry.timestamp).toLocaleTimeString()}
          {entry.duration && ` • ${entry.duration}ms`}
        </div>
      )}
    </div>
  );
}

export default HistoryTimelineUI;

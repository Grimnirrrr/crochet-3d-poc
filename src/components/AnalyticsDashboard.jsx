import React, { useState, useEffect } from 'react';

export function AnalyticsDashboard() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalPatterns: 0,
    totalExports: 0,
    totalRoundsBuilt: 0,
    averageSessionTime: 0,
    featureUsage: {},
    patternComplexity: [],
    lastUpdated: null
  });

  // Track events
  const trackEvent = (eventName, data = {}) => {
    const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
    events.push({
      event: eventName,
      data,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId()
    });
    localStorage.setItem('analyticsEvents', JSON.stringify(events));
    updateMetrics();
  };

  // Get or create session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
      trackNewSession();
    }
    return sessionId;
  };

  // Track new session
  const trackNewSession = () => {
    const sessions = JSON.parse(localStorage.getItem('analyticsSessions') || '[]');
    sessions.push({
      id: getSessionId(),
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      referrer: document.referrer || 'direct'
    });
    localStorage.setItem('analyticsSessions', JSON.stringify(sessions));
  };

  // Update metrics from stored data
  const updateMetrics = () => {
    const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
    const sessions = JSON.parse(localStorage.getItem('analyticsSessions') || '[]');
    const patterns = JSON.parse(localStorage.getItem('crochetPatterns') || '[]');

    // Calculate feature usage
    const featureUsage = {};
    events.forEach(event => {
      featureUsage[event.event] = (featureUsage[event.event] || 0) + 1;
    });

    // Calculate pattern complexity
    const patternComplexity = patterns.map(p => ({
      name: p.name,
      rounds: p.rounds,
      stitches: p.totalStitches,
      date: new Date(p.savedDate).toLocaleDateString()
    }));

    // Calculate average session time
    const now = new Date();
    const avgTime = sessions.reduce((acc, session) => {
      const start = new Date(session.startTime);
      const duration = (now - start) / 1000 / 60; // minutes
      return acc + duration;
    }, 0) / (sessions.length || 1);

    setMetrics({
      totalSessions: sessions.length,
      totalPatterns: patterns.length,
      totalExports: featureUsage['export_pdf'] + featureUsage['export_json'] + featureUsage['export_text'] || 0,
      totalRoundsBuilt: featureUsage['add_round'] || 0,
      averageSessionTime: Math.round(avgTime),
      featureUsage,
      patternComplexity,
      lastUpdated: new Date().toISOString()
    });
  };

  // Initialize metrics on mount
  useEffect(() => {
    getSessionId(); // Initialize session
    updateMetrics();
    
    // Update metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Export analytics data
  const exportAnalytics = () => {
    const data = {
      metrics,
      events: JSON.parse(localStorage.getItem('analyticsEvents') || '[]'),
      sessions: JSON.parse(localStorage.getItem('analyticsSessions') || '[]'),
      feedback: JSON.parse(localStorage.getItem('userFeedback') || '[]'),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear all analytics data
  const clearAnalytics = () => {
    if (confirm('Are you sure you want to clear all analytics data?')) {
      localStorage.removeItem('analyticsEvents');
      localStorage.removeItem('analyticsSessions');
      updateMetrics();
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Analytics Toggle Button */}
      <button
        onClick={() => setShowDashboard(!showDashboard)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          zIndex: 998,
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}
      >
        📊 Analytics Dashboard
      </button>

      {/* Analytics Dashboard Modal */}
      {showDashboard && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          zIndex: 2001,
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#fbbf24' }}>
              📊 Usage Analytics
            </h2>
            <button
              onClick={() => setShowDashboard(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {/* Key Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '25px'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.2)',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
                {metrics.totalSessions}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Sessions</div>
            </div>

            <div style={{
              background: 'rgba(99, 102, 241, 0.2)',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6366f1' }}>
                {metrics.totalPatterns}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Patterns Created</div>
            </div>

            <div style={{
              background: 'rgba(251, 191, 36, 0.2)',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fbbf24' }}>
                {metrics.totalExports}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Exports</div>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>
                {metrics.averageSessionTime}m
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Avg Session</div>
            </div>
          </div>

          {/* Feature Usage */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#fbbf24' }}>
              Feature Usage
            </h3>
            {Object.entries(metrics.featureUsage).length > 0 ? (
              <div style={{ fontSize: '13px' }}>
                {Object.entries(metrics.featureUsage)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([feature, count]) => (
                    <div key={feature} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '5px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <span>{feature.replace(/_/g, ' ')}</span>
                      <span style={{ color: '#10b981' }}>{count}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ opacity: 0.6, fontSize: '13px' }}>No events tracked yet</p>
            )}
          </div>

          {/* Pattern Complexity */}
          {metrics.patternComplexity.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#fbbf24' }}>
                Pattern Complexity
              </h3>
              <div style={{ fontSize: '13px' }}>
                {metrics.patternComplexity.map((pattern, idx) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    padding: '5px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <span>{pattern.name}</span>
                    <span>{pattern.rounds} rounds</span>
                    <span>{pattern.stitches} stitches</span>
                    <span style={{ opacity: 0.6 }}>{pattern.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={clearAnalytics}
              style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear Data
            </button>
            <button
              onClick={exportAnalytics}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Export Analytics
            </button>
          </div>

          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: 'rgba(251, 191, 36, 0.1)',
            borderRadius: '6px',
            fontSize: '12px',
            opacity: 0.8
          }}>
            💡 Analytics help you understand how users interact with your app.
            Export this data to make informed decisions about future development.
          </div>
        </div>
      )}
    </>
  );
}

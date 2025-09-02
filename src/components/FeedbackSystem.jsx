import React, { useState } from 'react';

export function FeedbackSystem() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState('bug');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [userRating, setUserRating] = useState(0);
  
  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      alert('Please enter some feedback before submitting');
      return;
    }
    
    // Collect feedback data
    const feedbackData = {
      type: feedbackType,
      message: feedbackText,
      rating: userRating,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      appVersion: '1.0.0'
    };
    
    // Store in localStorage (in real app, send to server)
    const existingFeedback = JSON.parse(localStorage.getItem('userFeedback') || '[]');
    existingFeedback.push(feedbackData);
    localStorage.setItem('userFeedback', JSON.stringify(existingFeedback));
    
    console.log('Feedback submitted:', feedbackData);
    
    // Show confirmation
    setFeedbackSent(true);
    setFeedbackText('');
    setUserRating(0);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setFeedbackSent(false);
      setShowFeedback(false);
    }, 3000);
  };
  
  // Export feedback for developer review
  const exportFeedback = () => {
    const feedback = localStorage.getItem('userFeedback') || '[]';
    const blob = new Blob([feedback], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feedback-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setShowFeedback(!showFeedback)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        title="Send Feedback"
      >
        💬
      </button>
      
      {/* Feedback Modal */}
      {showFeedback && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '320px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 1001,
          color: 'white'
        }}>
          {!feedbackSent ? (
            <>
              <h3 style={{ 
                margin: '0 0 15px 0',
                fontSize: '18px',
                color: '#fbbf24'
              }}>
                📝 Send Feedback
              </h3>
              
              {/* Feedback Type */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                  Feedback Type:
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="bug">🐛 Bug Report</option>
                  <option value="feature">✨ Feature Request</option>
                  <option value="improvement">💡 Improvement</option>
                  <option value="compliment">❤️ Compliment</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>
              
              {/* Rating */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                  Rate your experience:
                </label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: star <= userRating ? '#fbbf24' : '#4a5568',
                        transition: 'color 0.2s'
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Feedback Text */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                  Your feedback:
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you think..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              {/* Submit Button */}
              <button
                onClick={handleSubmitFeedback}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Send Feedback
              </button>
              
              {/* Developer Export (hidden for users) */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={exportFeedback}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '5px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fbbf24',
                    border: '1px solid #fbbf24',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  [Dev] Export All Feedback
                </button>
              )}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
              <h3 style={{ color: '#10b981' }}>Thank You!</h3>
              <p style={{ opacity: 0.8 }}>Your feedback has been received</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

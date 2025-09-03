export function useAnalytics() {
  const trackEvent = (eventName, data = {}) => {
    const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
    events.push({
      event: eventName,
      data,
      timestamp: new Date().toISOString(),
      sessionId: sessionStorage.getItem('sessionId')
    });
    localStorage.setItem('analyticsEvents', JSON.stringify(events));
  };

  return { trackEvent };
}

import React, { useState, useEffect } from 'react';

export function QuickStartGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Check if first time user
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenQuickStart');
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, []);
  
  const steps = [
    {
      title: "Welcome to Crochet 3D Visualizer! 🧶",
      content: "Let's take a quick tour to get you started.",
      highlight: null
    },
    {
      title: "Step 1: Choose a Pattern",
      content: "Click on template buttons or type your own pattern in the text area.",
      highlight: "pattern-input"
    },
    {
      title: "Step 2: Parse Your Pattern",
      content: "Click 'Parse & Visualize Pattern' to convert text to 3D.",
      highlight: "parse-button"
    },
    {
      title: "Step 3: Build in 3D",
      content: "Click 'Add Round' to see your pattern come to life!",
      highlight: "add-round"
    },
    {
      title: "Step 4: Interact",
      content: "Click and drag to rotate, scroll to zoom the 3D view.",
      highlight: "canvas"
    },
    {
      title: "Step 5: Export & Save",
      content: "Export your pattern as PDF, JSON, or save to your library.",
      highlight: "export"
    }
  ];
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };
  
  const handleClose = () => {
    setShowGuide(false);
    localStorage.setItem('hasSeenQuickStart', 'true');
  };
  
  if (!showGuide) {
    return (
      <button
        onClick={() => {
          setShowGuide(true);
          setCurrentStep(0);
        }}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          zIndex: 998
        }}
      >
        ❓ Quick Start Guide
      </button>
    );
  }
  
  return (
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
      zIndex: 2000,
      maxWidth: '400px',
      width: '90%'
    }}>
      <h2 style={{
        margin: '0 0 20px 0',
        fontSize: '20px',
        color: '#fbbf24'
      }}>
        {steps[currentStep].title}
      </h2>
      
      <p style={{
        fontSize: '14px',
        lineHeight: '1.6',
        marginBottom: '20px',
        opacity: 0.9
      }}>
        {steps[currentStep].content}
      </p>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          gap: '5px'
        }}>
          {steps.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: idx === currentStep ? '#fbbf24' : '#4a5568'
              }}
            />
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleClose}
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
            Skip
          </button>
          
          <button
            onClick={handleNext}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {currentStep === steps.length - 1 ? 'Get Started!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

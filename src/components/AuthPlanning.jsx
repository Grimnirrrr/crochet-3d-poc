import React, { useState } from 'react';

export function AuthPlanning() {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');
  
  // Tier comparison
  const tiers = {
    free: {
      name: 'Free',
      price: '$0',
      features: [
        '5 patterns saved',
        'Basic 3D visualization',
        'Export to JSON/Text',
        'Pattern parsing',
        'Yarn calculator'
      ],
      limitations: [
        'No PDF export',
        'No texture mapping',
        'Limited to 100 stitches',
        'No cloud sync'
      ]
    },
    pro: {
      name: 'Pro',
      price: '$4.99/month',
      features: [
        'Unlimited patterns',
        'Advanced 3D features',
        'All export formats',
        'Priority support',
        'Cloud sync',
        'Custom colors',
        'Texture mapping',
        'No stitch limit'
      ],
      limitations: []
    },
    team: {
      name: 'Team',
      price: '$19.99/month',
      features: [
        'Everything in Pro',
        'Share patterns with team',
        'Collaborative editing',
        'Pattern versioning',
        'Admin dashboard',
        'API access',
        'Custom branding'
      ],
      limitations: []
    }
  };
  
  // Implementation roadmap
  const implementationSteps = [
    {
      phase: 'Phase 1: Basic Auth',
      tasks: [
        'Set up Firebase or Supabase',
        'Email/password authentication',
        'User profile storage',
        'Session management'
      ],
      effort: '8 hours',
      priority: 'High'
    },
    {
      phase: 'Phase 2: User Data',
      tasks: [
        'Link patterns to users',
        'Cloud storage for patterns',
        'User preferences',
        'Usage tracking per user'
      ],
      effort: '12 hours',
      priority: 'High'
    },
    {
      phase: 'Phase 3: Subscription',
      tasks: [
        'Stripe integration',
        'Payment processing',
        'Subscription management',
        'Billing portal'
      ],
      effort: '16 hours',
      priority: 'Medium'
    },
    {
      phase: 'Phase 4: Feature Gating',
      tasks: [
        'Limit free tier features',
        'Pro feature unlocks',
        'Usage quotas',
        'Upgrade prompts'
      ],
      effort: '8 hours',
      priority: 'Medium'
    }
  ];
  
  // Monetization analysis
  const revenueProjection = {
    assumptions: {
      totalUsers: 1000,
      freeToProConversion: 0.02, // 2%
      proUsers: 20,
      monthlyRevenue: 99.80,
      yearlyRevenue: 1197.60
    }
  };
  
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '15px',
      marginTop: '20px'
    }}>
      <h2 style={{ 
        fontSize: '18px', 
        margin: '0 0 15px 0', 
        color: '#fbbf24'
      }}>
        💰 Days 29-30: Auth & Monetization
      </h2>
      
      {/* Decision Point */}
      <div style={{
        padding: '15px',
        background: 'rgba(99, 102, 241, 0.2)',
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>
          🤔 Should You Add Authentication?
        </h3>
        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
          <strong>Consider auth if:</strong>
          <ul style={{ margin: '5px 0 10px 20px' }}>
            <li>You have 100+ active users</li>
            <li>Users request cloud sync</li>
            <li>You want to monetize</li>
            <li>You need user analytics</li>
          </ul>
          <strong>Skip auth if:</strong>
          <ul style={{ margin: '5px 0 0 20px' }}>
            <li>Local storage is sufficient</li>
            <li>You want to keep it simple</li>
            <li>Privacy is a concern</li>
            <li>You're testing the concept</li>
          </ul>
        </div>
      </div>
      
      {/* Pricing Tiers */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#fbbf24' }}>
          💳 Potential Pricing Tiers
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}>
          {Object.entries(tiers).map(([key, tier]) => (
            <div
              key={key}
              onClick={() => setSelectedPlan(key)}
              style={{
                padding: '10px',
                background: selectedPlan === key 
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(0, 0, 0, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                border: selectedPlan === key
                  ? '2px solid #10b981'
                  : '2px solid transparent'
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                {tier.name}
              </div>
              <div style={{ fontSize: '20px', color: '#fbbf24', marginBottom: '10px' }}>
                {tier.price}
              </div>
              <div style={{ fontSize: '11px' }}>
                {tier.features.slice(0, 3).map((feature, i) => (
                  <div key={i} style={{ marginBottom: '3px' }}>
                    ✓ {feature}
                  </div>
                ))}
                {tier.features.length > 3 && (
                  <div style={{ opacity: 0.7 }}>
                    +{tier.features.length - 3} more features
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Selected Plan Details */}
      {selectedPlan && (
        <div style={{
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '12px'
        }}>
          <h4 style={{ marginBottom: '10px', color: '#fbbf24' }}>
            {tiers[selectedPlan].name} Plan Details
          </h4>
          <div style={{ marginBottom: '10px' }}>
            <strong>Features:</strong>
            <ul style={{ margin: '5px 0 0 20px' }}>
              {tiers[selectedPlan].features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </div>
          {tiers[selectedPlan].limitations.length > 0 && (
            <div>
              <strong>Limitations:</strong>
              <ul style={{ margin: '5px 0 0 20px' }}>
                {tiers[selectedPlan].limitations.map((limitation, i) => (
                  <li key={i} style={{ opacity: 0.8 }}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Implementation Steps */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid #8b5cf6',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {showDetails ? 'Hide' : 'Show'} Implementation Roadmap
        </button>
        
        {showDetails && (
          <div style={{ marginTop: '10px' }}>
            {implementationSteps.map((step, i) => (
              <div
                key={i}
                style={{
                  padding: '10px',
                  marginBottom: '10px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '6px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <strong style={{ fontSize: '13px', color: '#6366f1' }}>
                    {step.phase}
                  </strong>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: step.priority === 'High'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(251, 191, 36, 0.2)',
                    borderRadius: '3px'
                  }}>
                    {step.priority} Priority
                  </span>
                </div>
                <ul style={{
                  margin: '5px 0 10px 20px',
                  fontSize: '12px',
                  opacity: 0.9
                }}>
                  {step.tasks.map((task, j) => (
                    <li key={j}>{task}</li>
                  ))}
                </ul>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                  ⏱️ Estimated effort: {step.effort}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Revenue Projection */}
      <div style={{
        padding: '15px',
        background: 'rgba(16, 185, 129, 0.1)',
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#10b981' }}>
          📊 Revenue Projection (Conservative)
        </h3>
        <div style={{ fontSize: '12px', lineHeight: '1.8' }}>
          <div>Total Users: {revenueProjection.assumptions.totalUsers}</div>
          <div>Free → Pro Conversion: {(revenueProjection.assumptions.freeToProConversion * 100).toFixed(0)}%</div>
          <div>Pro Users: {revenueProjection.assumptions.proUsers}</div>
          <div style={{ 
            marginTop: '10px', 
            paddingTop: '10px', 
            borderTop: '1px solid rgba(255,255,255,0.1)' 
          }}>
            <strong>Monthly Revenue: ${revenueProjection.assumptions.monthlyRevenue.toFixed(2)}</strong><br/>
            <strong>Yearly Revenue: ${revenueProjection.assumptions.yearlyRevenue.toFixed(2)}</strong>
          </div>
        </div>
      </div>
      
      {/* Recommendation */}
      <div style={{
        padding: '10px',
        background: 'rgba(251, 191, 36, 0.1)',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <strong>💡 Recommendation:</strong><br/>
        Based on your roadmap's focus on validation (Day 25), consider keeping the app free initially. 
        Add authentication only when you have clear user demand for cloud features. 
        The current local-storage approach is sufficient for MVP validation.
        <br/><br/>
        <strong>If implementing:</strong> Start with Firebase Auth (easiest) and Stripe for payments. 
        Total implementation time: ~44 hours.
      </div>
    </div>
  );
}
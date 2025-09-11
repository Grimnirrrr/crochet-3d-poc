// src/components/PayPerUseUI.jsx
// UI component for pay-per-use billing display

import React, { useState } from 'react';

export function PayPerUseUI({
  usage = {},
  projection = {},
  transactions = [],
  paymentState = {},
  onProcessPayment,
  onToggleAutoPay,
  onViewHistory
}) {
  const [showTransactions, setShowTransactions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString();
  };
  
  // Handle payment
  const handlePayment = () => {
    setShowPaymentModal(true);
  };
  
  const confirmPayment = () => {
    if (onProcessPayment) {
      onProcessPayment(usage.pendingCharges);
    }
    setShowPaymentModal(false);
  };
  
  // Calculate status color
  const getStatusColor = () => {
    if (usage.pendingCharges >= 10) return '#ef4444'; // Red
    if (usage.pendingCharges >= 5) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };
  
  return (
    <>
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        minWidth: '260px',
        maxWidth: '320px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 998,
        border: `2px solid ${getStatusColor()}`
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
          paddingBottom: '10px',
          borderBottom: '1px solid #444'
        }}>
          <h3 style={{ 
            margin: 0,
            fontSize: '14px',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💳 Pay-Per-Use
          </h3>
          {paymentState.autoPayEnabled && (
            <span style={{
              fontSize: '10px',
              background: '#10b981',
              color: '#000',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              AUTO
            </span>
          )}
        </div>
        
        {/* Current Charges */}
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px'
        }}>
          <div style={{ 
            fontSize: '11px', 
            color: '#888',
            marginBottom: '5px'
          }}>
            Current Period: {usage.currentPeriod}
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span>Extra Pieces:</span>
            <span style={{ fontWeight: 'bold' }}>
              {usage.extraPieces || 0}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span>Rate:</span>
            <span style={{ color: '#888' }}>
              $0.02/piece
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            paddingTop: '8px',
            borderTop: '1px solid #333'
          }}>
            <span>Pending:</span>
            <span style={{ color: getStatusColor() }}>
              {formatCurrency(usage.pendingCharges || 0)}
            </span>
          </div>
        </div>
        
        {/* Payment Actions */}
        {usage.pendingCharges >= 1.00 && (
          <div style={{ marginBottom: '15px' }}>
            <button
              onClick={handlePayment}
              disabled={paymentState.paymentPending}
              style={{
                width: '100%',
                padding: '8px',
                background: paymentState.paymentPending 
                  ? '#666' 
                  : `linear-gradient(135deg, ${getStatusColor()}, ${getStatusColor()}dd)`,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: paymentState.paymentPending ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                opacity: paymentState.paymentPending ? 0.5 : 1
              }}
            >
              {paymentState.paymentPending 
                ? 'Processing...' 
                : `Pay ${formatCurrency(usage.pendingCharges)}`}
            </button>
          </div>
        )}
        
        {/* Monthly Projection */}
        {projection && (
          <div style={{
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '6px',
            border: '1px solid #f59e0b33'
          }}>
            <div style={{ 
              fontSize: '11px',
              color: '#f59e0b',
              marginBottom: '8px'
            }}>
              Monthly Projection
            </div>
            
            <div style={{
              display: 'grid',
              gap: '5px',
              fontSize: '11px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Current:</span>
                <span>{formatCurrency(projection.currentCost || 0)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Projected:</span>
                <span style={{ color: '#f59e0b' }}>
                  {formatCurrency(projection.projectedCost || 0)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#888'
              }}>
                <span>Daily avg:</span>
                <span>{formatCurrency(projection.dailyRate || 0)}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Recent Transactions */}
        <div style={{ marginBottom: '10px' }}>
          <div 
            onClick={() => setShowTransactions(!showTransactions)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '5px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              fontSize: '11px'
            }}
          >
            <span>Recent Transactions</span>
            <span>{showTransactions ? '▼' : '▶'}</span>
          </div>
          
          {showTransactions && (
            <div style={{
              marginTop: '8px',
              maxHeight: '120px',
              overflowY: 'auto',
              fontSize: '10px'
            }}>
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map((txn, idx) => (
                  <div 
                    key={txn.id || idx}
                    style={{
                      padding: '4px',
                      marginBottom: '4px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '3px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ color: '#888' }}>
                      {txn.pieceName || 'Extra piece'}
                    </span>
                    <span style={{ 
                      color: txn.status === 'paid' ? '#10b981' : '#f59e0b'
                    }}>
                      {formatCurrency(txn.cost)}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#666', textAlign: 'center', padding: '10px' }}>
                  No transactions yet
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Settings */}
        <div style={{
          paddingTop: '10px',
          borderTop: '1px solid #333'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontSize: '11px'
          }}>
            <span>Auto-pay at $10</span>
            <input
              type="checkbox"
              checked={paymentState.autoPayEnabled}
              onChange={onToggleAutoPay}
              disabled={!paymentState.hasPaymentMethod}
              style={{ cursor: 'pointer' }}
            />
          </label>
          
          {!paymentState.hasPaymentMethod && (
            <div style={{
              marginTop: '5px',
              fontSize: '10px',
              color: '#f59e0b'
            }}>
              ⚠️ Add payment method to enable auto-pay
            </div>
          )}
        </div>
        
        {/* Last Billing */}
        <div style={{
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px solid #333',
          fontSize: '10px',
          color: '#666'
        }}>
          Last billing: {formatDate(usage.lastBillingDate)}
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '400px',
            border: '2px solid #10b981',
            color: 'white'
          }}>
            <h2 style={{ 
              margin: '0 0 20px 0',
              color: '#10b981'
            }}>
              Process Payment
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <p>You're about to pay for your pay-per-use charges:</p>
              
              <div style={{
                padding: '15px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                margin: '15px 0'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>Extra pieces:</span>
                  <span>{usage.extraPieces || 0}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  paddingTop: '8px',
                  borderTop: '1px solid #10b98133'
                }}>
                  <span>Total:</span>
                  <span style={{ color: '#10b981' }}>
                    {formatCurrency(usage.pendingCharges || 0)}
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PayPerUseUI;

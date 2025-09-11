// src/utils/payPerUseManager.js
// D7: Pay-per-use system for Pro tier overflow

import { toSafeVector3 } from './safeTypes';

export class PayPerUseManager {
  constructor() {
    // Pricing configuration
    this.config = {
      pricePerPiece: 0.02,
      currency: 'USD',
      billingCycle: 'monthly',
      paymentThreshold: 1.00, // Minimum charge amount
      autoBillThreshold: 10.00, // Auto-charge at this amount
      warningThreshold: 5.00 // Warn user at this amount
    };
    
    // Usage tracking
    this.usage = {
      extraPieces: 0,
      totalCost: 0,
      transactions: [],
      pendingCharges: 0,
      lastBillingDate: null,
      currentBillingPeriod: this.getCurrentBillingPeriod()
    };
    
    // Payment state
    this.paymentState = {
      hasPaymentMethod: false,
      autoPayEnabled: false,
      paymentPending: false,
      lastPaymentStatus: null
    };
    
    // Usage history by period
    this.billingHistory = new Map();
    
    // Callbacks
    this.callbacks = {
      onThresholdReached: null,
      onPaymentRequired: null,
      onUsageUpdate: null
    };
    
    this.loadStoredData();
  }
  
  // Get current billing period (month-year)
  getCurrentBillingPeriod() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  
  // Track extra piece usage
  trackExtraPiece(pieceData, tierLimits) {
    const currentPeriod = this.getCurrentBillingPeriod();
    
    // Create transaction record
    const transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'extra_piece',
      pieceId: pieceData.id,
      pieceName: pieceData.name,
      cost: this.config.pricePerPiece,
      timestamp: Date.now(),
      period: currentPeriod,
      status: 'pending'
    };
    
    // Update usage
    this.usage.extraPieces++;
    this.usage.totalCost += this.config.pricePerPiece;
    this.usage.pendingCharges += this.config.pricePerPiece;
    this.usage.transactions.push(transaction);
    
    // Update billing history
    if (!this.billingHistory.has(currentPeriod)) {
      this.billingHistory.set(currentPeriod, {
        pieces: 0,
        cost: 0,
        transactions: []
      });
    }
    
    const periodData = this.billingHistory.get(currentPeriod);
    periodData.pieces++;
    periodData.cost += this.config.pricePerPiece;
    periodData.transactions.push(transaction);
    
    // Check thresholds
    this.checkThresholds();
    
    // Save state
    this.saveData();
    
    // Trigger callback
    if (this.callbacks.onUsageUpdate) {
      this.callbacks.onUsageUpdate(this.getUsageStats());
    }
    
    return transaction;
  }
  
  // Check payment thresholds
  checkThresholds() {
    const pending = this.usage.pendingCharges;
    
    // Auto-bill threshold
    if (pending >= this.config.autoBillThreshold && this.paymentState.autoPayEnabled) {
      this.initiateAutoBilling();
    }
    // Warning threshold
    else if (pending >= this.config.warningThreshold) {
      if (this.callbacks.onThresholdReached) {
        this.callbacks.onThresholdReached({
          amount: pending,
          threshold: 'warning',
          message: `You have $${pending.toFixed(2)} in pending charges`
        });
      }
    }
    // Payment required threshold
    else if (pending >= this.config.paymentThreshold) {
      if (this.callbacks.onPaymentRequired) {
        this.callbacks.onPaymentRequired({
          amount: pending,
          minPayment: this.config.paymentThreshold
        });
      }
    }
  }
  
  // Initiate auto-billing
  initiateAutoBilling() {
    if (!this.paymentState.hasPaymentMethod) {
      console.warn('No payment method on file for auto-billing');
      return false;
    }
    
    const amount = this.usage.pendingCharges;
    
    // Create billing record
    const billing = {
      id: `bill_${Date.now()}`,
      amount: amount,
      pieces: this.usage.extraPieces,
      period: this.getCurrentBillingPeriod(),
      status: 'processing',
      timestamp: Date.now()
    };
    
    // In production, this would call payment processor
    console.log(`Processing auto-payment: $${amount.toFixed(2)}`);
    
    // Simulate payment processing
    setTimeout(() => {
      this.processPaymentComplete(billing.id, true);
    }, 1000);
    
    this.paymentState.paymentPending = true;
    return billing;
  }
  
  // Process manual payment
  processManualPayment(amount = null) {
    const payAmount = amount || this.usage.pendingCharges;
    
    if (payAmount < this.config.paymentThreshold) {
      return {
        success: false,
        error: `Minimum payment is $${this.config.paymentThreshold.toFixed(2)}`
      };
    }
    
    // Create payment record
    const payment = {
      id: `pay_${Date.now()}`,
      amount: payAmount,
      method: 'manual',
      timestamp: Date.now(),
      status: 'processing'
    };
    
    // In production, this would open payment modal
    console.log(`Processing manual payment: $${payAmount.toFixed(2)}`);
    
    this.paymentState.paymentPending = true;
    
    // Simulate payment
    setTimeout(() => {
      this.processPaymentComplete(payment.id, true);
    }, 1500);
    
    return {
      success: true,
      paymentId: payment.id,
      amount: payAmount
    };
  }
  
  // Complete payment processing
  processPaymentComplete(paymentId, success) {
    this.paymentState.paymentPending = false;
    this.paymentState.lastPaymentStatus = success ? 'success' : 'failed';
    
    if (success) {
      // Clear pending charges
      const amountPaid = this.usage.pendingCharges;
      this.usage.pendingCharges = 0;
      this.usage.lastBillingDate = Date.now();
      
      // Mark transactions as paid
      this.usage.transactions.forEach(txn => {
        if (txn.status === 'pending') {
          txn.status = 'paid';
          txn.paymentId = paymentId;
        }
      });
      
      console.log(`Payment successful: $${amountPaid.toFixed(2)}`);
      
      // Save state
      this.saveData();
      
      return {
        success: true,
        amountPaid,
        paymentId
      };
    } else {
      console.error('Payment failed');
      return {
        success: false,
        error: 'Payment processing failed'
      };
    }
  }
  
  // Get usage statistics
  getUsageStats() {
    const currentPeriod = this.getCurrentBillingPeriod();
    const periodData = this.billingHistory.get(currentPeriod) || {
      pieces: 0,
      cost: 0
    };
    
    return {
      currentPeriod,
      extraPieces: this.usage.extraPieces,
      totalCost: this.usage.totalCost,
      pendingCharges: this.usage.pendingCharges,
      periodPieces: periodData.pieces,
      periodCost: periodData.cost,
      transactionCount: this.usage.transactions.length,
      lastBillingDate: this.usage.lastBillingDate,
      paymentPending: this.paymentState.paymentPending
    };
  }
  
  // Get billing history
  getBillingHistory(limit = 6) {
    const history = [];
    const periods = Array.from(this.billingHistory.keys()).sort().reverse();
    
    for (let i = 0; i < Math.min(limit, periods.length); i++) {
      const period = periods[i];
      const data = this.billingHistory.get(period);
      history.push({
        period,
        ...data
      });
    }
    
    return history;
  }
  
  // Get detailed transaction list
  getTransactions(filter = {}) {
    let transactions = [...this.usage.transactions];
    
    if (filter.period) {
      transactions = transactions.filter(t => t.period === filter.period);
    }
    
    if (filter.status) {
      transactions = transactions.filter(t => t.status === filter.status);
    }
    
    if (filter.limit) {
      transactions = transactions.slice(-filter.limit);
    }
    
    return transactions.reverse(); // Most recent first
  }
  
  // Calculate projected monthly cost
  getProjectedMonthlyCost() {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const currentPeriod = this.getCurrentBillingPeriod();
    const periodData = this.billingHistory.get(currentPeriod) || { cost: 0 };
    
    // Project based on current usage rate
    const dailyRate = periodData.cost / daysPassed;
    const projectedTotal = dailyRate * daysInMonth;
    
    return {
      currentCost: periodData.cost,
      projectedCost: projectedTotal,
      dailyRate: dailyRate,
      daysRemaining: daysInMonth - daysPassed
    };
  }
  
  // Set payment method
  setPaymentMethod(hasMethod) {
    this.paymentState.hasPaymentMethod = hasMethod;
    this.saveData();
  }
  
  // Toggle auto-pay
  toggleAutoPay() {
    if (!this.paymentState.hasPaymentMethod) {
      return {
        success: false,
        error: 'Payment method required for auto-pay'
      };
    }
    
    this.paymentState.autoPayEnabled = !this.paymentState.autoPayEnabled;
    this.saveData();
    
    return {
      success: true,
      autoPayEnabled: this.paymentState.autoPayEnabled
    };
  }
  
  // Set callbacks
  setCallbacks(callbacks) {
    Object.assign(this.callbacks, callbacks);
  }
  
  // Reset usage (for new billing period)
  resetPeriod() {
    const currentPeriod = this.getCurrentBillingPeriod();
    
    if (this.usage.currentBillingPeriod !== currentPeriod) {
      // Archive old period
      if (this.usage.currentBillingPeriod) {
        this.billingHistory.set(this.usage.currentBillingPeriod, {
          pieces: this.usage.extraPieces,
          cost: this.usage.totalCost,
          transactions: [...this.usage.transactions]
        });
      }
      
      // Reset for new period
      this.usage.extraPieces = 0;
      this.usage.totalCost = 0;
      this.usage.transactions = [];
      this.usage.currentBillingPeriod = currentPeriod;
      
      this.saveData();
    }
  }
  
  // Save data to localStorage (safe)
  saveData() {
    const safeData = {
      usage: {
        extraPieces: this.usage.extraPieces,
        totalCost: this.usage.totalCost,
        pendingCharges: this.usage.pendingCharges,
        lastBillingDate: this.usage.lastBillingDate,
        currentBillingPeriod: this.usage.currentBillingPeriod
      },
      paymentState: this.paymentState,
      config: this.config
    };
    
    try {
      localStorage.setItem('payPerUseData', JSON.stringify(safeData));
    } catch (e) {
      console.warn('Could not save pay-per-use data:', e);
    }
  }
  
  // Load stored data
  loadStoredData() {
    try {
      const stored = localStorage.getItem('payPerUseData');
      if (stored) {
        const data = JSON.parse(stored);
        Object.assign(this.usage, data.usage || {});
        Object.assign(this.paymentState, data.paymentState || {});
        Object.assign(this.config, data.config || {});
      }
    } catch (e) {
      console.warn('Could not load pay-per-use data:', e);
    }
  }
  
  // Clear all data
  clearData() {
    this.usage = {
      extraPieces: 0,
      totalCost: 0,
      transactions: [],
      pendingCharges: 0,
      lastBillingDate: null,
      currentBillingPeriod: this.getCurrentBillingPeriod()
    };
    
    this.billingHistory.clear();
    this.saveData();
  }
}

export default PayPerUseManager;

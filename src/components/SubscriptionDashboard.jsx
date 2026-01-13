import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import SubscriptionManager from '../components/SubscriptionManager';
import './SubscriptionDashboard.css';

const SubscriptionDashboard = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('user.role');

  useEffect(() => {
    if (!auth.currentUser) return;

    // Load subscriptions
    const subsQuery = query(
      collection(db, 'subscriptions'),
      where(userRole === 'parent' ? 'parentId' : 'driverId', '==', auth.currentUser.uid)
    );

    const unsubscribeSubs = onSnapshot(subsQuery, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubscriptions(subs);
    });

    // Load service agreements
    const agreementsQuery = query(
      collection(db, 'serviceAgreements'),
      where(userRole === 'parent' ? 'parentId' : 'driverId', '==', auth.currentUser.uid)
    );

    const unsubscribeAgreements = onSnapshot(agreementsQuery, (snapshot) => {
      const agrs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAgreements(agrs);
    });

    // Load payment history
    const paymentsQuery = query(collection(db, 'payments'));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const pays = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter payments for user's subscriptions
      const userSubIds = subscriptions.map(s => s.id);
      const userPayments = pays.filter(p => userSubIds.includes(p.subscriptionId));
      setPayments(userPayments);
      setLoading(false);
    });

    return () => {
      unsubscribeSubs();
      unsubscribeAgreements();
      unsubscribePayments();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { processPayment, cancelSubscription } = SubscriptionManager();

  const handlePayment = async (subscriptionId) => {
    const result = await processPayment(subscriptionId, 'card');
    if (result.success) {
      alert('Payment processed successfully!');
    } else {
      alert(`Payment failed: ${result.error}`);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (window.confirm('Are you sure you want to cancel this subscription? This will stop the transport service.')) {
      const reason = prompt('Please provide a reason for cancellation (optional):');
      await cancelSubscription(subscriptionId, reason || '');
      alert('Subscription cancelled successfully.');
    }
  };

  const signAgreement = async (agreementId) => {
    try {
      await updateDoc(doc(db, 'serviceAgreements', agreementId), {
        parentSignedAt: new Date(),
        status: 'active',
        updatedAt: new Date()
      });
      alert('Agreement signed successfully! Your transport service is now active.');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error signing agreement:', error);
      alert('Failed to sign agreement. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'overdue': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) return date.toDate().toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading subscriptions...</div>;
  }

  return (
    <div className="subscription-dashboard">
      <h2>💳 {userRole === 'parent' ? 'My Subscriptions' : 'Service Management'}</h2>

      {/* Pending Agreements Section */}
      {agreements.filter(a => a.status === 'pending_parent_signature').length > 0 && (
        <div className="section">
          <h3>📋 Pending Agreements</h3>
          <p className="muted">Please review and sign these service agreements to activate your transport service.</p>
          
          {agreements.filter(a => a.status === 'pending_parent_signature').map((agreement) => (
            <div key={agreement.id} className="agreement-card">
              <div className="agreement-header">
                <h4>{agreement.childName} - Transport Service Agreement</h4>
                <span className="badge badge-warning">Pending Signature</span>
              </div>
              
              <div className="agreement-details">
                <div className="detail-row">
                  <span>Monthly Amount:</span>
                  <strong>${agreement.monthlyAmount}</strong>
                </div>
                <div className="detail-row">
                  <span>Pickup Time:</span>
                  <strong>{agreement.pickupTime}</strong>
                </div>
                <div className="detail-row">
                  <span>Contract Duration:</span>
                  <strong>{agreement.contractDuration} months</strong>
                </div>
                <div className="detail-row">
                  <span>Start Date:</span>
                  <strong>{formatDate(agreement.startDate)}</strong>
                </div>
              </div>

              <div className="agreement-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => signAgreement(agreement.id)}
                >
                  ✍️ Sign Agreement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Subscriptions Section */}
      {subscriptions.filter(s => s.status === 'active').length > 0 && (
        <div className="section">
          <h3>🚌 Active Subscriptions</h3>
          
          {subscriptions.filter(s => s.status === 'active').map((subscription) => (
            <div key={subscription.id} className="subscription-card">
              <div className="subscription-header">
                <h4>{subscription.childName} - School Transport</h4>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(subscription.status) }}
                >
                  {subscription.status.toUpperCase()}
                </span>
              </div>

              <div className="subscription-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Monthly Amount:</span>
                    <span className="value">${subscription.monthlyAmount}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Next Payment:</span>
                    <span className="value">{formatDate(subscription.nextPaymentDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Pickup Address:</span>
                    <span className="value">{subscription.pickupAddress}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Start Date:</span>
                    <span className="value">{formatDate(subscription.startDate)}</span>
                  </div>
                </div>
              </div>

              {userRole === 'parent' && (
                <div className="subscription-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handlePayment(subscription.id)}
                  >
                    💳 Pay Now
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleCancelSubscription(subscription.id)}
                  >
                    ❌ Cancel Service
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment History Section */}
      {payments.length > 0 && (
        <div className="section">
          <h3>💰 Payment History</h3>
          
          <div className="payment-history">
            {payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="payment-row">
                <div className="payment-info">
                  <span className="payment-amount">${payment.amount}</span>
                  <span className="payment-date">{formatDate(payment.dueDate)}</span>
                </div>
                <span 
                  className="payment-status"
                  style={{ color: getStatusColor(payment.status) }}
                >
                  {payment.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subscriptions.length === 0 && agreements.length === 0 && (
        <div className="empty-state">
          <h3>No Subscriptions Found</h3>
          <p className="muted">
            {userRole === 'parent' 
              ? 'You don\'t have any active transport subscriptions. Visit "Find Drivers" to request transport services.'
              : 'You don\'t have any active service agreements. Accept transport requests to start earning monthly income.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDashboard;
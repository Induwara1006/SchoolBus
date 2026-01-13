import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const SubscriptionManager = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  // const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRole = localStorage.getItem('user.role');
    
    if (userRole === 'parent') {
      // Load parent's subscriptions
      const subsQuery = query(
        collection(db, 'subscriptions'), 
        where('parentId', '==', auth.currentUser.uid),
        where('status', '==', 'active')
      );
      
      const unsubscribe = onSnapshot(subsQuery, (snapshot) => {
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubscriptions(subs);
        setLoading(false);
      });

      return unsubscribe;
    } else if (userRole === 'driver') {
      // Load driver's subscriptions
      const subsQuery = query(
        collection(db, 'subscriptions'), 
        where('driverId', '==', auth.currentUser.uid),
        where('status', '==', 'active')
      );
      
      const unsubscribe = onSnapshot(subsQuery, (snapshot) => {
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubscriptions(subs);
        setLoading(false);
      });

      return unsubscribe;
    }
  }, []);

  const createSubscription = async (agreementData) => {
    const subscriptionId = `sub_${Date.now()}`;
    const startDate = new Date();
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const subscription = {
      id: subscriptionId,
      parentId: agreementData.parentId,
      driverId: agreementData.driverId,
      childId: agreementData.childId,
      childName: agreementData.childName,
      monthlyAmount: agreementData.monthlyAmount,
      currency: agreementData.currency || 'USD',
      status: 'active',
      startDate: startDate,
      nextPaymentDate: nextPaymentDate,
      pickupAddress: agreementData.pickupAddress,
      dropoffAddress: agreementData.dropoffAddress,
      pickupTime: agreementData.pickupTime,
      contractDuration: agreementData.contractDuration || 12, // months
      paymentHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'subscriptions', subscriptionId), subscription);
    
    // Create initial payment record
    await createPaymentRecord(subscriptionId, {
      amount: agreementData.monthlyAmount,
      dueDate: nextPaymentDate,
      status: 'pending'
    });

    return subscriptionId;
  };

  const createPaymentRecord = async (subscriptionId, paymentData) => {
    const paymentId = `pay_${Date.now()}`;
    const payment = {
      id: paymentId,
      subscriptionId: subscriptionId,
      amount: paymentData.amount,
      dueDate: paymentData.dueDate,
      paidDate: paymentData.paidDate || null,
      status: paymentData.status, // pending, paid, overdue, failed
      paymentMethod: paymentData.paymentMethod || null,
      transactionId: paymentData.transactionId || null,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'payments', paymentId), payment);
    return paymentId;
  };

  const processPayment = async (subscriptionId, paymentMethod = 'manual') => {
    try {
      // In a real app, this would integrate with Stripe, PayPal, etc.
      const paymentId = `pay_${Date.now()}`;
      const now = new Date();
      
      // Update subscription with next payment date
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      const nextPayment = new Date(subscription.nextPaymentDate);
      nextPayment.setMonth(nextPayment.getMonth() + 1);

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        nextPaymentDate: nextPayment,
        lastPaymentDate: now,
        updatedAt: now
      });

      // Create payment record
      await createPaymentRecord(subscriptionId, {
        amount: subscription.monthlyAmount,
        dueDate: subscription.nextPaymentDate,
        paidDate: now,
        status: 'paid',
        paymentMethod: paymentMethod,
        transactionId: paymentId
      });

      return { success: true, paymentId };
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error: error.message };
    }
  };

  const cancelSubscription = async (subscriptionId, reason = '') => {
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
      updatedAt: new Date()
    });
  };

  if (loading) {
    return <div className="loading">Loading subscriptions...</div>;
  }

  return { 
    subscriptions, 
    createSubscription, 
    processPayment, 
    cancelSubscription,
    createPaymentRecord 
  };
};

export default SubscriptionManager;
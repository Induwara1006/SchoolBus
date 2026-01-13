/**
 * Notification Service
 * Handles all notification-related operations
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Send a notification
 */
export const sendNotification = async (recipientId, title, message, type = 'info', data = {}) => {
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      recipientId,
      title,
      message,
      type,
      data,
      read: false,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to user notifications
 */
export const subscribeToNotifications = (userId, callback) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    callback(notifications);
  });
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
      })
    );
    
    await Promise.all(updates);
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify status change
 */
export const notifyStatusChange = async (studentId, studentName, oldStatus, newStatus, recipientId) => {
  const statusMessages = {
    'at-home': 'is now at home',
    'waiting-pickup': 'is waiting for pickup',
    'picked-up': 'has been picked up',
    'in-transit': 'is in transit',
    'at-school': 'has arrived at school',
    'returning': 'is returning home',
    'dropped-off': 'has been dropped off'
  };

  const message = `${studentName} ${statusMessages[newStatus] || 'status updated'}`;
  
  return sendNotification(
    recipientId,
    'Status Update',
    message,
    'status',
    { studentId, oldStatus, newStatus }
  );
};

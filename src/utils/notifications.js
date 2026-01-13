import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Create a notification for a user
 * @param {string} userId - The user ID to send notification to
 * @param {string} type - Type of notification (status-change, new-request, etc.)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
export async function createNotification(userId, type, title, message) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: serverTimestamp()
    });

  } catch (error) {

  }
}

/**
 * Notify parent when child status changes
 * @param {string} parentId - Parent user ID
 * @param {string} childName - Child's name
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 */
export async function notifyStatusChange(parentId, childName, oldStatus, newStatus) {
  const statusLabels = {
    'at-home': 'At Home 🏠',
    'picked-up': 'Picked Up 🚌',
    'in-transit-to-school': 'Going to School 🚛',
    'dropped-at-school': 'At School 🏫',
    'in-transit-to-home': 'Going Home 🔄',
    'dropped-at-home': 'Dropped at Home ✅'
  };

  await createNotification(
    parentId,
    'status-change',
    '🔄 Status Update',
    `${childName} status changed: ${statusLabels[oldStatus] || oldStatus} → ${statusLabels[newStatus] || newStatus}`
  );
}

/**
 * Notify driver about new ride request
 * @param {string} driverId - Driver user ID
 * @param {string} parentName - Parent's name
 * @param {string} childName - Child's name
 */
export async function notifyNewRequest(driverId, parentName, childName) {
  await createNotification(
    driverId,
    'new-request',
    '📨 New Ride Request',
    `${parentName} has requested transportation service for ${childName}`
  );
}

/**
 * Notify parent when request is accepted
 * @param {string} parentId - Parent user ID
 * @param {string} driverName - Driver's name
 * @param {string} childName - Child's name
 */
export async function notifyRequestAccepted(parentId, driverName, childName) {
  await createNotification(
    parentId,
    'request-accepted',
    '✅ Request Accepted',
    `${driverName} has accepted your ride request for ${childName}!`
  );
}

/**
 * Notify parent when request is rejected
 * @param {string} parentId - Parent user ID
 * @param {string} driverName - Driver's name
 * @param {string} childName - Child's name
 */
export async function notifyRequestRejected(parentId, driverName, childName) {
  await createNotification(
    parentId,
    'request-rejected',
    '❌ Request Declined',
    `${driverName} is unable to accept your ride request for ${childName}`
  );
}

/**
 * Notify about trip completion
 * @param {string} userId - User ID (parent or driver)
 * @param {string} childName - Child's name
 * @param {string} userRole - 'parent' or 'driver'
 */
export async function notifyTripCompleted(userId, childName, userRole) {
  const message = userRole === 'parent'
    ? `${childName} has been safely dropped off`
    : `Trip completed for ${childName}`;

  await createNotification(
    userId,
    'trip-completed',
    '🏁 Trip Completed',
    message
  );
}

/**
 * Notify about subscription expiring soon
 * @param {string} userId - User ID
 * @param {number} daysLeft - Days until expiration
 */
export async function notifySubscriptionExpiring(userId, daysLeft) {
  await createNotification(
    userId,
    'subscription-expiring',
    '⏰ Subscription Expiring',
    `Your subscription will expire in ${daysLeft} days. Please renew to continue service.`
  );
}

/**
 * Notify about payment received
 * @param {string} driverId - Driver user ID
 * @param {string} amount - Payment amount
 * @param {string} parentName - Parent's name
 */
export async function notifyPaymentReceived(driverId, amount, parentName) {
  await createNotification(
    driverId,
    'payment-received',
    '💰 Payment Received',
    `Received $${amount} from ${parentName}`
  );
}

export default {
  createNotification,
  notifyStatusChange,
  notifyNewRequest,
  notifyRequestAccepted,
  notifyRequestRejected,
  notifyTripCompleted,
  notifySubscriptionExpiring,
  notifyPaymentReceived
};

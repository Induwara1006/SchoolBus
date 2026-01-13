/**
 * Driver Service
 * Handles all driver-related database operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const DRIVERS_COLLECTION = 'drivers';
const USERS_COLLECTION = 'users';

/**
 * Get all available drivers
 */
export const getAvailableDrivers = async () => {
  try {
    const q = query(
      collection(db, DRIVERS_COLLECTION),
      where('isAvailable', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching drivers:', error);
    throw error;
  }
};

/**
 * Subscribe to available drivers updates
 */
export const subscribeToAvailableDrivers = (callback) => {
  const q = query(
    collection(db, DRIVERS_COLLECTION),
    where('isAvailable', '==', true)
  );
  return onSnapshot(q, (snapshot) => {
    const drivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(drivers);
  });
};

/**
 * Get driver by ID
 */
export const getDriverById = async (driverId) => {
  try {
    const driverDoc = await getDoc(doc(db, DRIVERS_COLLECTION, driverId));
    if (driverDoc.exists()) {
      return { id: driverDoc.id, ...driverDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching driver:', error);
    throw error;
  }
};

/**
 * Update driver location
 */
export const updateDriverLocation = async (driverId, location) => {
  try {
    const driverRef = doc(db, DRIVERS_COLLECTION, driverId);
    await updateDoc(driverRef, {
      location,
      lastLocationUpdate: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating driver location:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update driver availability
 */
export const updateDriverAvailability = async (driverId, isAvailable) => {
  try {
    const driverRef = doc(db, DRIVERS_COLLECTION, driverId);
    await updateDoc(driverRef, {
      isAvailable,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating driver availability:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to driver location updates
 */
export const subscribeToDriverLocation = (driverId, callback) => {
  const driverRef = doc(db, DRIVERS_COLLECTION, driverId);
  return onSnapshot(driverRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

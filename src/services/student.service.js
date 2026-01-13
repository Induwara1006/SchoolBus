/**
 * Student Service
 * Handles all student-related database operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const STUDENTS_COLLECTION = 'students';

/**
 * Get all students for a parent
 */
export const getStudentsByParent = async (parentId) => {
  try {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

/**
 * Get all students for a driver
 */
export const getStudentsByDriver = async (driverId) => {
  try {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('driverId', '==', driverId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

/**
 * Subscribe to students updates for a parent
 */
export const subscribeToStudentsByParent = (parentId, callback) => {
  const q = query(
    collection(db, STUDENTS_COLLECTION),
    where('parentId', '==', parentId)
  );
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(students);
  });
};

/**
 * Subscribe to students updates for a driver
 */
export const subscribeToStudentsByDriver = (driverId, callback) => {
  const q = query(
    collection(db, STUDENTS_COLLECTION),
    where('driverId', '==', driverId)
  );
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(students);
  });
};

/**
 * Add a new student
 */
export const addStudent = async (studentData) => {
  try {
    const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), {
      ...studentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding student:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update student data
 */
export const updateStudent = async (studentId, updates) => {
  try {
    const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
    await updateDoc(studentRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating student:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update student status
 */
export const updateStudentStatus = async (studentId, status) => {
  return updateStudent(studentId, { status });
};

/**
 * Delete a student
 */
export const deleteStudent = async (studentId) => {
  try {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get single student by ID
 */
export const getStudentById = async (studentId) => {
  try {
    const studentDoc = await getDoc(doc(db, STUDENTS_COLLECTION, studentId));
    if (studentDoc.exists()) {
      return { id: studentDoc.id, ...studentDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching student:', error);
    throw error;
  }
};

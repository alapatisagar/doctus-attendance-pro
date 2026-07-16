import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { getEmployeeAvatar } from './data';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export let app = null;
export let auth = null;
export let db = null;
export let storage = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization failed.', error);
}

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain);
const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const ensureAdminAccess = (email) => {
  if (adminEmails.length && !adminEmails.includes(email.toLowerCase())) {
    throw new Error('Only admin accounts can access this workspace. Configure VITE_ADMIN_EMAILS to allow access.');
  }
};

const normalizeUser = (user) => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName || user.email?.split('@')[0] || 'HR Admin',
  role: adminEmails.includes(user.email?.toLowerCase() || '') ? 'Admin' : 'HR Manager',
});

export const loginWithEmail = async (email, password) => {
  if (!isConfigured || !auth) {
    throw new Error('Firebase authentication is not configured. Add your environment variables first.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  ensureAdminAccess(normalizedEmail);
  await setPersistence(auth, browserLocalPersistence);

  const credentials = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  return normalizeUser(credentials.user);
};

export const registerWithEmail = async (email, password) => {
  if (!isConfigured || !auth) {
    throw new Error('Firebase authentication is not configured. Add your environment variables first.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  ensureAdminAccess(normalizedEmail);
  await setPersistence(auth, browserLocalPersistence);

  const credentials = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  return normalizeUser(credentials.user);
};

export const logoutSession = async () => {
  if (auth) {
    await signOut(auth);
  }
};

export const subscribeToAuth = (callback) => {
  if (!isConfigured || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    callback(user ? normalizeUser(user) : null);
  });
};

export const updateAuthProfile = async (displayName, photoURL) => {
  if (!auth?.currentUser) {
    throw new Error('No active user session found.');
  }

  await updateFirebaseProfile(auth.currentUser, { displayName, photoURL });
  return normalizeUser(auth.currentUser);
};

export const resetUserPassword = async (email) => {
  if (!auth) {
    throw new Error('Firebase authentication is not configured.');
  }

  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
};

export const firebaseReady = Boolean(app && auth && db && storage && isConfigured);

export const getCollectionDocs = async (collectionName) => {
  if (!db) {
    throw new Error('Firestore is not configured.');
  }

  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }));
};

export const addCollectionDoc = async (collectionName, data) => {
  if (!db) {
    throw new Error('Firestore is not configured.');
  }

  const payload = {
    ...data,
    createdAt: serverTimestamp(),
  };
  const result = await addDoc(collection(db, collectionName), payload);
  return { id: result.id, ...payload };
};

export const updateCollectionDoc = async (collectionName, id, data) => {
  if (!db) {
    throw new Error('Firestore is not configured.');
  }

  const documentRef = doc(db, collectionName, id);
  await updateDoc(documentRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return { id, ...data };
};

export const deleteCollectionDoc = async (collectionName, id) => {
  if (!db) {
    throw new Error('Firestore is not configured.');
  }

  await deleteDoc(doc(db, collectionName, id));
};

export const createDefaultSettings = async () => {
  if (!db) {
    throw new Error('Firestore is not configured.');
  }

  const settingsRef = doc(db, 'settings', 'company');
  const payload = {
    companyName: 'Doctus Attendance Pro',
    companyLogo: '',
    workHours: 8,
    weekStart: 'Monday',
    timezone: 'UTC',
    theme: 'Midnight Glow',
    officeStart: '09:00',
    officeEnd: '18:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    attendanceRules: 'Standard attendance policy with punctuality and leave compliance.',
  };
  await setDoc(settingsRef, payload, { merge: true });
  return payload;
};

export const uploadFile = async (file, path) => {
  if (!storage) {
    return getEmployeeAvatar({ name: path });
  }

  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  } catch (error) {
    console.warn('Firebase Storage upload skipped, using fallback avatar.', error);
    return getEmployeeAvatar({ name: path });
  }
};

export const uploadProfilePhoto = async (file, employeeId) => {
  return uploadFile(file, `employees/${employeeId}/${file.name}`);
};

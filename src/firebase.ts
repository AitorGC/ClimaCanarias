/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app: any = null;
let db: any = null;
let auth: any = null;
let googleProvider: any = null;

function getFirebase() {
  if (!app) {
    const firebaseConfig = {
      apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
      authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
    };
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  }
  return { db, auth, googleProvider };
}

export const getDb = () => getFirebase().db;
export const getAuthSvc = () => getFirebase().auth;
export const getGoogleProvider = () => getFirebase().googleProvider;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

/**
 * Handles Firestore errors and raises standard compliant error objects
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const authSvc = getAuthSvc();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authSvc.currentUser?.uid || null,
      email: authSvc.currentUser?.email || null,
      emailVerified: authSvc.currentUser?.emailVerified || null,
      isAnonymous: authSvc.currentUser?.isAnonymous || null,
      tenantId: authSvc.currentUser?.tenantId || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Trigger secure popup login with Google
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(getAuthSvc(), getGoogleProvider());
    return result.user;
  } catch (error) {
    console.error('Error during Google authentication: ', error);
    throw error;
  }
}

/**
 * Sign out from session
 */
export async function logout() {
  try {
    await signOut(getAuthSvc());
  } catch (error) {
    console.error('Error signing out: ', error);
    throw error;
  }
}


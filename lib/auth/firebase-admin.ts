"use server";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

export const initAdmin = () => {
  if (!getApps().length) {
    initializeApp({
      credential: cert(firebaseConfig),
    });
  }
};

// Export Firebase Admin services
export const adminAuth = getAuth(getApp());

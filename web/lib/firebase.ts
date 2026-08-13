"use client";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Fill these in from Firebase Console > Project Settings > General
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// On Firebase Hosting, firebase.json rewrites "/api/*" to these functions
// automatically, so a relative path works. On Vercel there's no such
// rewrite, so set NEXT_PUBLIC_FUNCTIONS_BASE_URL to your deployed Cloud
// Functions base URL, e.g.
// https://us-central1-YOUR_PROJECT.cloudfunctions.net
const FUNCTIONS_BASE = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || "";
export const CLAIM_DEPOSIT_URL = `${FUNCTIONS_BASE}/claimDeposit`;

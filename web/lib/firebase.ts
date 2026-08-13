"use client";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Fill these in from Firebase Console > Project Settings > General
const firebaseConfig = {
  apiKey: "AIzaSyCFoqcUnFJh12GgpV7Quu21C7ADnhyEBO4",
  authDomain: "topup-web-x.firebaseapp.com",
  projectId: "topup-web-x",
  storageBucket: "topup-web-x.firebasestorage.app",
  messagingSenderId: "1078332866185",
  appId: "1:1078332866185:web:30a17ace39e3a21725d058",
  measurementId: "G-8ZT2VZP304"
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

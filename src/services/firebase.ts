// src/services/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase.config";

const app = initializeApp(firebaseConfig);

// Export the auth and firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

/**
 * Firebase configuration
 * 
 * IMPORTANT: Replace these values with your own Firebase project config.
 * Go to Firebase Console → Project Settings → General → Your apps → Web app
 */
const firebaseConfig = {
  apiKey: "AIzaSyD8QWZjGHWzYTeE796Nljt-RIZIAPoiswE",
  authDomain: "maintain-iq-7fa4f.firebaseapp.com",
  projectId: "maintain-iq-7fa4f",
  storageBucket: "maintain-iq-7fa4f.firebasestorage.app",
  messagingSenderId: "1091042309284",
  appId: "1:1091042309284:web:89367a57ab8078a3c6a231",
  measurementId: "G-P7ZNQDF1NV"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app

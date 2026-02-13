// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "endosmanager",
  appId: "1:646296770186:web:a1e6e69bc13cd968bfbf73",
  storageBucket: "endosmanager.firebasestorage.app",
  apiKey: "AIzaSyDflcS32FC865tAp2H0TgGozCHah-3TwhY",
  authDomain: "endosmanager.firebaseapp.com",
  messagingSenderId: "646296770186",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

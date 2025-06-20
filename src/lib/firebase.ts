// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCYRgN5-8OwR5Wq6QZ8k6tOPcf3FR3cVeQ', // IMPORTANT: Replace with your actual API key in a secure way (e.g., environment variables)
  authDomain: 'mycrmapp-27a8a.firebaseapp.com',
  projectId: 'mycrmapp-27a8a',
  storageBucket: 'mycrmapp-27a8a.firebasestorage.app',
  messagingSenderId: '562571069840',
  appId: '1:562571069840:web:b8d1253a070623b1cb0b15',
  measurementId: 'G-1DF0YSY943', // Optional
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

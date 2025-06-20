// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDL7qey14ReYGqJcZgWrWiVmQEkeE6ztUY',
  authDomain: 'leadwise-7ea4f.firebaseapp.com',
  projectId: 'leadwise-7ea4f',
  storageBucket: 'leadwise-7ea4f.firebasestorage.app',
  messagingSenderId: '995756236505',
  appId: '1:995756236505:web:dc40e3c0647a9949cee8c8',
  measurementId: 'G-1QYCCXXW27',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

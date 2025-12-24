import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyADled_6JFjQ07VNQB0M5a3lJLgOcPXoTM',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'postitproject-bebd1.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'postitproject-bebd1',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'postitproject-bebd1.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '856878940668',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:856878940668:web:a3dc51e39a9ae43780550e',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://postitproject-bebd1-default-rtdb.europe-west1.firebasedatabase.app',
};

let app: FirebaseApp;
let database: Database;

export function initFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  }
  return { app, database };
}

export function getDb(): Database {
  if (!database) {
    initFirebase();
  }
  return database;
}

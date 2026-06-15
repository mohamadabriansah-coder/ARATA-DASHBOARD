import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Ini adalah kunci rahasia milikmu yang sudah benar
const firebaseConfig = {
  apiKey: "AIzaSyDNDOMQGw8y9cE1uhX5krdfdeohIYCtijI",
  authDomain: "arata-dashboard.firebaseapp.com",
  projectId: "arata-dashboard",
  storageBucket: "arata-dashboard.firebasestorage.app",
  messagingSenderId: "58291976545",
  appId: "1:58291976545:web:0ca77db6c2bb1beeefed20",
  measurementId: "G-9BC42NV5KW"
};

// Inisialisasi Firebase ke dalam aplikasi
const app = initializeApp(firebaseConfig);

// Export Auth dan Firestore agar bisa diakses dari file app/index.tsx
export const auth = getAuth(app);
export const db = getFirestore(app);
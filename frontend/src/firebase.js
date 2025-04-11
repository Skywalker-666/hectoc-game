// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 🔐 Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDB9w1yQLBi8-enm-XXXktwowZQ-Mh-FPQ", // ✅ replace XXX with real part if masked
  authDomain: "auth-ed81d.firebaseapp.com",
  projectId: "auth-ed81d",
  storageBucket: "auth-ed81d.appspot.com",
  messagingSenderId: "742480292966",
  appId: "1:742480292966:web:0e8ab896cdcc78e0a891a7",
  measurementId: "G-NH6HB8KV4E",
};

// 🔧 Initialize Firebase
const app = initializeApp(firebaseConfig);

// ⚙️ Get Auth and Google Provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 🧪 Optional: Set language to browser's default
auth.useDeviceLanguage(); // improves UX for localized messages

export { auth, googleProvider };

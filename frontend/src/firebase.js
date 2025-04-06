import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDB9w1yQLBi8-enm-XXXktwowZQ-Mh-FPQ",
  authDomain: "auth-ed81d.firebaseapp.com",
  projectId: "auth-ed81d",
  storageBucket: "auth-ed81d.appspot.com",
  messagingSenderId: "742480292966",
  appId: "1:742480292966:web:0e8ab896cdcc78e0a891a7",
  measurementId: "G-NH6HB8KV4E",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); // ✅ Export Google Provider

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBPl1UH_mqmgoAwE4d2wWPxGgM6I9045co",
  authDomain: "sspmanagement.firebaseapp.com",
  projectId: "sspmanagement",
  storageBucket: "sspmanagement.firebasestorage.app",
  messagingSenderId: "574741969620",
  appId: "1:574741969620:web:8e6b0b88db2b9557ce9941"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "sspdatabse");
export const storage = getStorage(app);

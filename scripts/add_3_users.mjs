import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBPl1UH_mqmgoAwE4d2wWPxGgM6I9045co",
  authDomain: "sspmanagement.firebaseapp.com",
  projectId: "sspmanagement",
  storageBucket: "sspmanagement.firebasestorage.app",
  messagingSenderId: "574741969620",
  appId: "1:574741969620:web:8e6b0b88db2b9557ce9941"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "sspdatabse"); // Use the correct named database as before

async function seed() {
  try {
    console.log("Seeding 3 users...");
    const roles = [
      { email: 'admin@ssp.com', role: 'admin', name: 'Admin User' },
      { email: 'hod@ssp.com', role: 'hod', name: 'Tech HOD' },
      { email: 'santo@ssp.com', role: 'santo', name: 'Pujya Santo' }
    ];

    for (const user of roles) {
      const newUserId = user.role + '_' + Date.now();
      await setDoc(doc(db, 'users', newUserId), {
        email: user.email,
        password: 'password123',
        role: user.role,
        roles: [user.role],
        name: user.name,
        isActive: true,
        createdAt: new Date().toISOString()
      });
      console.log(`Created user: ${user.email} | Role: ${user.role}`);
    }
    
    console.log("3 Users Seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users: ", error);
    process.exit(1);
  }
}

seed();

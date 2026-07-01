/**
 * Reset Firestore users to 5 role-specific test accounts.
 * Run: node scripts/reset-ssp-users.mjs
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBPl1UH_mqmgoAwE4d2wWPxGgM6I9045co',
  authDomain: 'sspmanagement.firebaseapp.com',
  projectId: 'sspmanagement',
  storageBucket: 'sspmanagement.firebasestorage.app',
  messagingSenderId: '574741969620',
  appId: '1:574741969620:web:8e6b0b88db2b9557ce9941',
};

const SEED_USERS = [
  {
    email: 'admin@ssp.com',
    password: 'password123',
    name: 'Admin User',
    roles: ['admin'],
    primaryRole: 'admin',
    role: 'admin',
    isActive: true,
  },
  {
    email: 'santo@ssp.com',
    password: 'password123',
    name: 'Santo User',
    roles: ['santo'],
    primaryRole: 'santo',
    role: 'santo',
    santoTag: 'Pujya Gunidh Swami',
    isActive: true,
  },
  {
    email: 'hod@ssp.com',
    password: 'password123',
    name: 'HOD User',
    roles: ['hod'],
    primaryRole: 'hod',
    role: 'hod',
    isActive: true,
  },
  {
    email: 'triage@ssp.com',
    password: 'password123',
    name: 'Central Triage Coordinator',
    roles: ['coordinator'],
    primaryRole: 'coordinator',
    role: 'coordinator',
    isActive: true,
  },
  {
    email: 'member@ssp.com',
    password: 'password123',
    name: 'Member User',
    roles: ['member'],
    primaryRole: 'member',
    role: 'member',
    isActive: true,
  },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'sspdatabse');

console.log('Fetching existing users...');
const snap = await getDocs(collection(db, 'users'));
const existing = [];
snap.forEach((d) => existing.push({ id: d.id, ...d.data() }));
console.log(`Found ${existing.length} user(s). Deleting...`);

for (const user of existing) {
  await deleteDoc(doc(db, 'users', user.id));
  console.log(`  Deleted: ${user.email || user.name || user.id}`);
}

console.log('Creating 5 role-specific users...');
for (const user of SEED_USERS) {
  const ref = await addDoc(collection(db, 'users'), {
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log(`  Created: ${user.email} (${user.primaryRole}) → ${ref.id}`);
}

console.log('\nDone. Login credentials (password: password123):');
for (const u of SEED_USERS) {
  console.log(`  ${u.primaryRole.padEnd(8)} → ${u.email}`);
}

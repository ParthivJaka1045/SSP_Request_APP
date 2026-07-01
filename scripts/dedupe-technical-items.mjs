/**
 * One-time cleanup: keep one technical item per name, delete duplicates.
 * Run: node scripts/dedupe-technical-items.mjs
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBPl1UH_mqmgoAwE4d2wWPxGgM6I9045co',
  authDomain: 'sspmanagement.firebaseapp.com',
  projectId: 'sspmanagement',
  storageBucket: 'sspmanagement.firebasestorage.app',
  messagingSenderId: '574741969620',
  appId: '1:574741969620:web:8e6b0b88db2b9557ce9941',
};

function normalizeName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'sspdatabse');

const q = query(collection(db, 'items'), where('category', '==', 'technical'));
const snap = await getDocs(q);
const items = [];
snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
items.sort((a, b) => String(a.name).localeCompare(String(b.name)));

const seen = new Map();
const toDelete = [];

for (const item of items) {
  const key = normalizeName(item.name);
  if (!key) continue;
  if (seen.has(key)) {
    toDelete.push(item);
  } else {
    seen.set(key, item);
  }
}

console.log(`Found ${items.length} technical items, ${toDelete.length} duplicates to delete.`);

for (const item of toDelete) {
  await deleteDoc(doc(db, 'items', item.id));
  console.log(`Deleted: ${item.name} (${item.id})`);
}

console.log('Done. Kept items:');
for (const item of seen.values()) {
  console.log(`  - ${item.name} (${item.id})`);
}

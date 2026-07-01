/**
 * Keep a single technical catalog item for testing; delete all others.
 * Run: node scripts/keep-one-technical-item.mjs
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const KEEP_NAME = 'MacBook Pro';

const firebaseConfig = {
  apiKey: 'AIzaSyBPl1UH_mqmgoAwE4d2wWPxGgM6I9045co',
  authDomain: 'sspmanagement.firebaseapp.com',
  projectId: 'sspmanagement',
  storageBucket: 'sspmanagement.firebasestorage.app',
  messagingSenderId: '574741969620',
  appId: '1:574741969620:web:8e6b0b88db2b9557ce9941',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'sspdatabse');

const q = query(collection(db, 'items'), where('category', '==', 'technical'));
const snap = await getDocs(q);
const items = [];
snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

const keeper = items.find((i) => i.name === KEEP_NAME) || items[0];
if (!keeper) {
  console.log('No technical items found.');
  process.exit(0);
}

const toDelete = items.filter((i) => i.id !== keeper.id);
console.log(`Keeping: ${keeper.name} (${keeper.id})`);
console.log(`Deleting ${toDelete.length} other item(s)...`);

for (const item of toDelete) {
  await deleteDoc(doc(db, 'items', item.id));
  console.log(`  deleted: ${item.name}`);
}

console.log('Done.');

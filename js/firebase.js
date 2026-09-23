import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  child, 
  update, 
  push, 
  onValue, 
  remove, 
  query, 
  orderByChild, 
  equalTo 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFwusZ60ZdCwNfg__YrMA6Ww25jeBOiDk",
  authDomain: "vid1-e2c7d.firebaseapp.com",
  databaseURL: "https://vid1-e2c7d-default-rtdb.firebaseio.com",
  projectId: "vid1-e2c7d",
  storageBucket: "vid1-e2c7d.firebasestorage.app",
  messagingSenderId: "323883326794",
  appId: "1:323883326794:web:e1254b899aefa6584175b3",
  measurementId: "G-GQHZRYG3B0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { 
  auth, 
  db, 
  ref, 
  set, 
  get, 
  child, 
  update, 
  push, 
  onValue, 
  remove, 
  query, 
  orderByChild, 
  equalTo,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};

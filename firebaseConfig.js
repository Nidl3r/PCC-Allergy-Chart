import { initializeApp } from "firebase/app";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9JwIJAi-DaPaC0VfMxqNzvYP77jqoL9g",
  authDomain: "pcc-allergy-chart.firebaseapp.com",
  projectId: "pcc-allergy-chart",
  storageBucket: "pcc-allergy-chart.appspot.com",
  messagingSenderId: "66610041437",
  appId: "1:66610041437:web:2949bf34e20ca081c573b4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Enable offline persistence
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("✅ Firestore offline persistence enabled");
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("⚠️ This browser does not support offline persistence.");
    }
  });

export { db };

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9JwIJAi-DaPaC0VfMxqNzvYP77jqoL9g",
  authDomain: "pcc-allergy-chart.firebaseapp.com",
  projectId: "pcc-allergy-chart",
  storageBucket: "pcc-allergy-chart.appspot.com",
  messagingSenderId: "66610041437",
  appId: "1:66610041437:web:2949bf34e20ca081c573b4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

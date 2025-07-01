import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Initialize Firebase
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

let allDishes = [];
let allAllergens = new Set();

async function loadDishes() {
  const snapshot = await getDocs(collection(db, "dishes"));
  snapshot.forEach(doc => {
    const data = doc.data();
    allDishes.push(data);
    data.allergens.forEach(a => allAllergens.add(a));
  });
  renderCheckboxes();
}

function renderCheckboxes() {
  const container = document.getElementById("checkboxes");
  container.innerHTML = ""; // clear in case of reload
  Array.from(allAllergens)
    .sort()
    .forEach(allergy => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" value="${allergy}"> ${allergy}
      `;
      container.appendChild(label);
      container.appendChild(document.createElement("br"));
    });
}

function getSelectedAllergies() {
  const selected = [];
  document.querySelectorAll("#checkboxes input:checked").forEach(input => {
    selected.push(input.value);
  });
  return selected;
}

function showResults(safeDishes) {
  const results = document.getElementById("results");
  results.innerHTML = "";

  if (safeDishes.length === 0) {
    results.innerHTML = "<p><strong>No safe dishes found for selected allergens.</strong></p>";
    return;
  }

  const grouped = {};
  safeDishes.forEach(dish => {
    if (!grouped[dish.category]) grouped[dish.category] = [];
    grouped[dish.category].push(dish.name);
  });

  for (const category in grouped) {
    const section = document.createElement("div");
    section.innerHTML = `<h3>${category}</h3><ul>${grouped[category]
      .map(name => `<li>${name}</li>`)
      .join("")}</ul>`;
    results.appendChild(section);
  }
}

document.getEleme

// 🔁 Update this version anytime your dish data changes significantly
const dataVersion = "v1.0";

// 🔍 Detect private browsing in Safari
try {
  localStorage.setItem('test', '1');
  localStorage.removeItem('test');
  console.log("✅ localStorage is available");
} catch (e) {
  alert("Safari is in Private Browsing Mode. Please use regular browsing.");
}

// 🧹 Clear outdated cache if version has changed
if (localStorage.getItem("dataVersion") !== dataVersion) {
  console.log("⚠️ New data version detected. Clearing old cache.");
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("dishes_")) {
      localStorage.removeItem(key);
    }
  });
  localStorage.setItem("dataVersion", dataVersion);
}

// ✅ Firebase configuration (now using global `firebase` object from script tag)
// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD9JwIJAi-DaPaC0VfMxqNzvYP77jqoL9g",
  authDomain: "pcc-allergy-chart.firebaseapp.com",
  projectId: "pcc-allergy-chart",
  storageBucket: "pcc-allergy-chart.appspot.com",
  messagingSenderId: "66610041437",
  appId: "1:66610041437:web:2949bf34e20ca081c573b4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firestore
const db = firebase.firestore();


// Optional: Enable offline persistence (can skip this if unstable on Safari)
firebase.firestore().enablePersistence().catch(function (err) {
  if (err.code === 'failed-precondition') {
    console.warn("⚠️ Offline persistence failed: multiple tabs open.");
  } else if (err.code === 'unimplemented') {
    console.warn("⚠️ Offline persistence not supported in this browser.");
  }
});

// 🔁 App state variables
let allDishes = [];
let allAllergens = new Set();
let selectedVenue = localStorage.getItem("selectedVenue") || null;

let searchQuery = "";
let sortAsc = true;


// Load dishes from Firestore filtered by selected venue
async function loadDishes() {
  console.log("🔁 loadDishes() called");
  console.log("📡 Selected venue:", selectedVenue);

  allDishes = [];
  allAllergens.clear();

  const localKey = `dishes_${selectedVenue}`;
  const cached = localStorage.getItem(localKey);
  console.log("📦 Cached data found:", !!cached);

  try {
    console.log("🌐 Attempting to fetch from Firestore...");
    const snapshot = await getDocs(collection(db, "dishes"));
    let count = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.venue === selectedVenue) {
        allDishes.push(data);
        data.allergens.forEach(allergen => allAllergens.add(allergen));
        count++;
      }
    });

    console.log(`✅ Loaded ${count} dishes from Firestore for venue "${selectedVenue}"`);
    localStorage.setItem(localKey, JSON.stringify(allDishes));
  } catch (error) {
    console.warn("⚠️ Firestore fetch failed:", error);

    if (cached) {
      allDishes = JSON.parse(cached);
      allDishes.forEach(dish => {
        if (dish.allergens) {
          dish.allergens.forEach(allergen => allAllergens.add(allergen));
        }
      });
      console.log("🧠 Loaded dishes from localStorage:", allDishes);
    } else {
      console.error("❌ No cached dishes found and Firestore failed.");
      document.getElementById("allergen-form").innerHTML =
        "<p style='color:red;'>No data available. Check your connection.</p>";
      return;
    }
  }

  console.log("🔍 Found allergens:", Array.from(allAllergens));
  renderCheckboxes();
}



// Render checkboxes
function renderCheckboxes() {
  const form = document.getElementById("allergen-form");
  form.innerHTML = "";

  const filtered = Array.from(allAllergens)
    .filter(allergen => allergen.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sortAsc ? a.localeCompare(b) : b.localeCompare(a));

  if (filtered.length === 0) {
    form.innerHTML = "<p style='color:red;'>No allergies found. Check connection or venue data.</p>";
    return;
  }

  filtered.forEach(allergen => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" name="allergen" value="${allergen}"> ${allergen}
    `;
    form.appendChild(label);
  });
}


// Get selected allergies
function getSelectedAllergies() {
  const checked = document.querySelectorAll('input[name="allergen"]:checked');
  return Array.from(checked).map(input => input.value);
}


// 🔁 Record user allergy selection in Firestore
async function recordSelection(venue, selectedAllergies) {
  try {
    await db.collection("selections").add({
      venue: venue,
      selectedAllergies: selectedAllergies,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error recording selection:", error);
  }
}


// ✅ Show only dishes that DO NOT contain any selected allergens
function filterSafeDishes() {
  const selected = getSelectedAllergies();

  // 🔄 Save selection to Firestore
  recordSelection(selectedVenue, selected);

  const safe = allDishes.filter(dish => {
    if (!dish.allergens || dish.allergens.length === 0) return false;

    // ✅ Include only if ALL selected allergies are safe (covered) by this dish
    return selected.every(selectedAllergen => dish.allergens.includes(selectedAllergen));
  });

  showResults(safe);
}



// Display results grouped by category
function showResults(safeDishes) {
  const container = document.getElementById("modal-content");
  container.innerHTML = `
    <h2>Dishes You Can Eat:</h2>
    <button id="download-image">Download as Image</button>
  `;

  if (safeDishes.length === 0) {
    container.innerHTML += "<p><strong>No safe dishes found.</strong></p>";
  } else {
    const hotKeywords = ['hot', 'grilled', 'roasted', 'fried', 'sautéed', 'baked', 'stewed', 'broiled'];
    const isHot = (name) => hotKeywords.some(kw => name.toLowerCase().includes(kw));

    // Sort hot dishes first
    safeDishes.sort((a, b) => {
      const aHot = isHot(a.name);
      const bHot = isHot(b.name);
      return aHot === bHot ? 0 : aHot ? -1 : 1;
    });

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
      container.appendChild(section);
    }
  }

  document.getElementById("modal-overlay").style.display = "flex";

  document.getElementById("download-image").addEventListener("click", () => {
    html2canvas(document.getElementById("modal-content")).then(canvas => {
      const link = document.createElement("a");
      link.download = `safe-dishes-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  });
}


// Event Listeners
document.getElementById("show-safe-dishes").addEventListener("click", filterSafeDishes);

document.getElementById("allergen-search").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderCheckboxes();
});

document.getElementById("sort-toggle").addEventListener("click", () => {
  sortAsc = !sortAsc;
  document.getElementById("sort-toggle").innerText = `Sort: ${sortAsc ? 'A → Z' : 'Z → A'}`;
  renderCheckboxes();
});

document.getElementById("enter-app").addEventListener("click", () => {
  const venueSelect = document.getElementById("venue-select");
  const selectedVenueValue = venueSelect.value;

  if (!selectedVenueValue) {
    alert("Please select a venue.");
    return;
  }

  // Save selected venue to memory and localStorage
  selectedVenue = selectedVenueValue;
  localStorage.setItem("selectedVenue", selectedVenue); // ✅ Save it

  // Toggle screen visibility
  document.getElementById("venue-screen").style.display = "none";
  document.getElementById("app-content").style.display = "block";

  // Reveal navigation buttons in the header
  const goBackBtn = document.getElementById("go-back");
  const showDishesBtn = document.getElementById("show-safe-dishes");

  goBackBtn.style.display = "inline-flex";
  showDishesBtn.style.display = "inline-flex";

  // Ensure layout consistency
  goBackBtn.style.alignItems = "center";
  showDishesBtn.style.alignItems = "center";

  loadDishes();
});



document.getElementById("go-back").addEventListener("click", () => {
  document.getElementById("app-content").style.display = "none";
  document.getElementById("venue-screen").style.display = "block";

  // ✅ Hide buttons
  document.getElementById("go-back").style.display = "none";
  document.getElementById("show-safe-dishes").style.display = "none";

  selectedVenue = null;
  allDishes = [];
  allAllergens.clear();
  document.getElementById("allergen-form").innerHTML = "";
});

document.getElementById("close-modal").addEventListener("click", () => {
  document.getElementById("modal-overlay").style.display = "none";
});


function logDebug(message) {
  document.getElementById("debug-log").innerHTML += `<div>${message}</div>`;
}


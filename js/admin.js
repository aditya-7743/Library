
// ==================== ADMIN PANEL LOGIC ====================

// ⚠️ MASTER CONFIG ⚠️
// This points to YOUR central Firebase where you store client list.
// YOU MUST REPLACE THIS WITH YOUR OWN FIREBASE CONFIG FOR THE MASTER DB
const MASTER_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCKAo6SSf9L3ojktZiyo0_cBvVYlP_YifU",
    authDomain: "magadhlibrary-12a08.firebaseapp.com",
    projectId: "magadhlibrary-12a08",
    storageBucket: "magadhlibrary-12a08.firebasestorage.app",
    messagingSenderId: "1028338567572",
    appId: "1:1028338567572:web:2e3f4417433ceb3db5a781",
    databaseURL: "https://magadhlibrary-12a08-default-rtdb.firebaseio.com"
};

// Initialize Master App
let masterApp;
try {
    masterApp = firebase.initializeApp(MASTER_FIREBASE_CONFIG, "masterApp");
} catch (e) {
    // If already exists (hot reload)
    masterApp = firebase.app("masterApp");
}

const db = masterApp.database();
const auth = masterApp.auth();

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const mainContent = document.getElementById('mainContent');
const authContainer = document.getElementById('authContainer');
const userInfo = document.getElementById('userInfo');
const userEmailSpan = document.getElementById('userEmail');
const addClientForm = document.getElementById('addClientForm');
const clientsList = document.getElementById('clientsList');
const toast = document.getElementById('toast');

// --- Authentication ---

// Only allow specific emails if needed (optional security layer)
const ALLOWED_ADMINS = ['adityasinha.magadh@gmail.com']; // Replace with your email if you want to lock it down

auth.onAuthStateChanged(user => {
    if (user) {
        // Optional: Check strict email whitelist
        // if (!ALLOWED_ADMINS.includes(user.email)) {
        //     alert("Access Denied: You are not an admin.");
        //     auth.signOut();
        //     return;
        // }

        userInfo.classList.remove('hidden');
        loginBtn.classList.add('hidden');
        userEmailSpan.textContent = user.email;
        mainContent.classList.remove('hidden');
        loadClients(); // Load data
    } else {
        userInfo.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
});

loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(e => alert(e.message));
});

logoutBtn.addEventListener('click', () => auth.signOut());

// --- Core Logic ---

// Hall Template Management
const hallsContainer = document.getElementById('hallsContainer');
const addHallBtn = document.getElementById('addHallBtn');

// Add a Hall Row
function addHallRow(id = '', name = '', seatCount = '') {
    const rowId = id || 'hall_' + Date.now();
    const div = document.createElement('div');
    div.className = "flex gap-2 items-center hall-row";
    div.dataset.id = rowId;

    div.innerHTML = `
        <input type="text" placeholder="Hall Name (e.g. Ground Floor)" value="${name}" class="hall-name w-1/2 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white">
        <input type="number" placeholder="Seats" value="${seatCount}" class="hall-seats w-1/4 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white">
        <button type="button" onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-300 text-xs px-2">X</button>
    `;
    hallsContainer.appendChild(div);
}

addHallBtn.addEventListener('click', () => addHallRow());

// Initialize with a default hall if empty
if (hallsContainer.children.length === 0) {
    addHallRow('hallA', 'Default Hall', 30);
}

// Color Picker Sync
['primary', 'secondary'].forEach(type => {
    const picker = document.getElementById(`${type}Color`);
    const text = document.getElementById(`${type}ColorText`);
    picker.addEventListener('input', (e) => text.value = e.target.value);
    text.addEventListener('input', (e) => picker.value = e.target.value);
});

// Save Client
addClientForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clientId = document.getElementById('clientId').value.trim().toLowerCase().replace(/\s+/g, '-');
    const name = document.getElementById('clientName').value.trim();
    const primaryColor = document.getElementById('primaryColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;
    const firebaseConfigStr = document.getElementById('firebaseConfig').value.trim();

    // Gather Features
    const features = [];
    document.querySelectorAll('input[name="features"]:checked').forEach(cb => features.push(cb.value));

    // Gather Halls
    const halls = [];
    document.querySelectorAll('.hall-row').forEach(row => {
        const hallName = row.querySelector('.hall-name').value.trim();
        const seats = parseInt(row.querySelector('.hall-seats').value);
        if (hallName && seats) {
            halls.push({
                id: row.dataset.id,
                name: hallName,
                seatCount: seats
            });
        }
    });

    if (!clientId) return alert("Client ID is required");
    if (halls.length === 0) return alert("Please add at least one hall.");

    let firebaseConfigJson;
    try {
        // Try to extract object from JS code if pasted as full block
        const cleanStr = firebaseConfigStr.trim();
        // Regex to find "const firebaseConfig = { ... };" or just "{ ... }"
        const match = cleanStr.match(/firebaseConfig\s*=\s*({[\s\S]*?});?/);

        let jsonStr = match ? match[1] : cleanStr;

        // Fix loose JSON (keys without quotes) if necessary, though Firebase gives valid JS which is not valid JSON
        // We need to ensure we can parse it.
        // Firebase console output is usually valid JS object syntax: apiKey: "..." (no quotes on key)
        // JSON.parse requires quotes: "apiKey": "..."

        // Simple heuristic: If it doesn't look like strict JSON (keys have quotes), try to convert JS obj to JSON
        if (!jsonStr.includes('"apiKey"')) {
            // Basic strict-ify: quote unquoted keys
            jsonStr = jsonStr.replace(/(\w+):/g, '"$1":');
            // Remove trailing commas if any (JSON doesn't allow them)
            jsonStr = jsonStr.replace(/,(\s*})/g, '$1');
            // Convert single quotes to double
            jsonStr = jsonStr.replace(/'/g, '"');
        }

        firebaseConfigJson = JSON.parse(jsonStr);

    } catch (err) {
        console.error(err);
        return alert("Could not parse Firebase Config. Please ensure you pasted the 'firebaseConfig' object correctly.");
    }

    const clientData = {
        clientId,
        name,
        theme: { primary: primaryColor, secondary: secondaryColor },
        firebaseConfig: firebaseConfigJson,
        halls: halls,
        enabledFeatures: features,
        createdAt: new Date().toISOString()
    };

    try {
        await db.ref(`clients/${clientId}`).set(clientData);
        showToast("Client saved successfully!");
        addClientForm.reset();
        hallsContainer.innerHTML = ''; // Clear halls
        addHallRow(); // Add default back
    } catch (err) {
        alert("Error saving: " + err.message);
    }
});

// Load Clients
function loadClients() {
    db.ref('clients').on('value', (snapshot) => {
        clientsList.innerHTML = '';
        const data = snapshot.val();

        if (!data) {
            clientsList.innerHTML = '<p class="text-gray-500">No clients found.</p>';
            return;
        }

        Object.values(data).forEach(client => {
            const el = document.createElement('div');
            el.className = "bg-slate-900 p-4 rounded border border-slate-700 flex justify-between items-center";

            // Generate link based on current location
            const baseUrl = window.location.href.replace('admin.html', '');
            const clientLink = `${baseUrl}?client=${client.clientId}`;

            el.innerHTML = `
                <div>
                    <h3 class="font-bold text-white">${client.name} <span class="text-gray-500 text-xs font-normal">(${client.clientId})</span></h3>
                    <a href="${clientLink}" target="_blank" class="text-blue-400 text-xs hover:underline break-all">${clientLink}</a>
                </div>
                <div class="flex gap-2">
                    <button onclick="editClient('${client.clientId}')" class="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded">Edit</button>
                    <button onclick="deleteClient('${client.clientId}')" class="text-sm text-red-400 hover:text-red-300 px-2">Delete</button>
                </div>
            `;
            clientsList.appendChild(el);
        });
    });
}

// Edit Client (Populate form)
window.editClient = async (clientId) => {
    const snapshot = await db.ref(`clients/${clientId}`).once('value');
    const data = snapshot.val();
    if (!data) return;

    document.getElementById('clientId').value = data.clientId;
    document.getElementById('clientName').value = data.name;
    document.getElementById('primaryColor').value = data.theme?.primary || '#6366f1';
    document.getElementById('primaryColorText').value = data.theme?.primary || '#6366f1';
    document.getElementById('secondaryColor').value = data.theme?.secondary || '#ec4899';
    document.getElementById('secondaryColorText').value = data.theme?.secondary || '#ec4899';
    document.getElementById('firebaseConfig').value = JSON.stringify(data.firebaseConfig, null, 2);

    // Populate Halls
    hallsContainer.innerHTML = '';
    if (data.halls && Array.isArray(data.halls)) {
        data.halls.forEach(hall => addHallRow(hall.id, hall.name, hall.seatCount));
    } else {
        addHallRow();
    }

    // Populate Features
    const features = data.enabledFeatures || ['students', 'seats', 'payments', 'attendance', 'reports', 'settings']; // Default all if missing
    document.querySelectorAll('input[name="features"]').forEach(cb => {
        cb.checked = features.includes(cb.value);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteClient = async (clientId) => {
    if (confirm(`Are you sure you want to delete ${clientId}? This cannot be undone.`)) {
        await db.ref(`clients/${clientId}`).remove();
    }
};

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('translate-y-20');
    setTimeout(() => toast.classList.add('translate-y-20'), 3000);
}

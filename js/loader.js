
// ==================== LOADER.JS - Dynamic Client Initialization ====================

// 1. MASTER CONFIG (Same as Admin Panel)
const MASTER_FIREBASE_CONFIG = {
    // ⚠️ REPLACE THIS WITH YOUR *MASTER* FIREBASE CONFIG ⚠️
    apiKey: "YOUR_MASTER_API_KEY",
    authDomain: "your-master-project.firebaseapp.com",
    projectId: "your-master-project",
    databaseURL: "https://your-master-project-default-rtdb.firebaseio.com",
};

(function () {
    // 2. Get Client ID from URL
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('client');

    if (!clientId) {
        // No client specified -> redirect to a landing page or show error
        document.body.innerHTML = `
            <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0f172a;color:white;font-family:sans-serif;">
                <h1>Magadh LMS</h1>
                <p>Please use your personalized link to access the library.</p>
                <p style="color:#64748b;font-size:0.9em;">If you are an admin, go to <a href="admin.html" style="color:#3b82f6;">/admin.html</a></p>
            </div>
        `;
        throw new Error("No client ID specified");
    }

    console.log(`Loading configuration for client: ${clientId}...`);

    // 3. Initialize Master App (Temporary)
    let masterApp;
    try {
        masterApp = firebase.initializeApp(MASTER_FIREBASE_CONFIG, "masterLoader");
    } catch (e) { masterApp = firebase.app("masterLoader"); }

    const db = masterApp.database();

    // 4. Fetch Client Properties
    db.ref(`clients/${clientId}`).once('value').then(snapshot => {
        const clientData = snapshot.val();

        if (!clientData) {
            document.body.innerHTML = `<h1 style="color:white;text-align:center;margin-top:20%;">Client not found: ${clientId}</h1>`;
            return;
        }

        console.log("Client config loaded:", clientData.name);

        // 5. Apply Theme (CSS Variables)
        if (clientData.theme) {
            const root = document.documentElement;
            root.style.setProperty('--primary-color', clientData.theme.primary);
            root.style.setProperty('--secondary-color', clientData.theme.secondary);

            // Allow Tailwind to pick up changes via style attribute binding if needed
            // But main CSS uses variables, so this is fine.
        }

        // 6. Stash Config for App to use
        window.LMS_CLIENT_CONFIG = clientData;

        // 7. Initialize the REAL Firebase App (The Client's App)
        // We defer this to firebase-db.js or do it here. 
        // Better to let firebase-db.js handle it, but we need to pass the config.

        // Dispatch event that config is ready
        window.dispatchEvent(new CustomEvent('lms:configReady', { detail: clientData }));

        // Update Page Title
        document.title = `${clientData.name} - LMS`;

    }).catch(err => {
        console.error("Failed to load client config:", err);
        document.body.innerHTML = `<h1 style="color:white;text-align:center;">Error loading configuration</h1>`;
    });

})();

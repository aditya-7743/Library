
// ==================== LOADER.JS - Dynamic Client Initialization ====================

// 1. MASTER CONFIG (Same as Admin Panel)
const MASTER_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCKAo6SSf9L3ojktZiyo0_cBvVYlP_YifU",
    authDomain: "magadhlibrary-12a08.firebaseapp.com",
    projectId: "magadhlibrary-12a08",
    storageBucket: "magadhlibrary-12a08.firebasestorage.app",
    messagingSenderId: "1028338567572",
    appId: "1:1028338567572:web:2e3f4417433ceb3db5a781",
    databaseURL: "https://magadhlibrary-12a08-default-rtdb.asia-southeast1.firebasedatabase.app"
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
    const statusEl = document.createElement('div');
    statusEl.style.cssText = "position:fixed;bottom:10px;right:10px;color:gray;font-size:10px;z-index:9999;";
    statusEl.innerText = "Connecting to Master Config...";
    document.body.appendChild(statusEl);

    const timeoutId = setTimeout(() => {
        document.body.innerHTML = `
            <div style="color:white;text-align:center;padding-top:20vh;font-family:sans-serif;">
                <h1>Connection Timeout</h1>
                <p>Could not fetch client configuration.</p>
                <p>Possible causes:</p>
                <ul style="text-align:left;display:inline-block;">
                    <li>Database Rules are locked (Check Firebase Console > Realtime Database > Rules).</li>
                    <li>Internet connection is unstable.</li>
                    <li>Invalid Master Config API Key.</li>
                </ul>
                <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;cursor:pointer;">Retry</button>
            </div>`;
    }, 8000);

    db.ref(`clients/${clientId}`).once('value').then(snapshot => {
        clearTimeout(timeoutId);
        const clientData = snapshot.val();

        if (!clientData) {
            document.body.innerHTML = `<h1 style="color:white;text-align:center;margin-top:20%;">Client not found: ${clientId}</h1>`;
            return;
        }

        statusEl.innerText = "Config Loaded. Initializing App...";
        console.log("Client config loaded:", clientData.name);

        // 5. Apply Theme
        if (clientData.theme) {
            const root = document.documentElement;
            root.style.setProperty('--primary-color', clientData.theme.primary);
            root.style.setProperty('--secondary-color', clientData.theme.secondary);
        }

        // 6. Stash Config
        window.LMS_CLIENT_CONFIG = clientData;

        // 7. Dispatch Event
        window.dispatchEvent(new CustomEvent('lms:configReady', { detail: clientData }));

        // Update Title
        document.title = `${clientData.name} - LMS`;
        statusEl.remove();

    }).catch(err => {
        clearTimeout(timeoutId);
        console.error("Failed to load client config:", err);
        document.body.innerHTML = `
            <div style="color:white;text-align:center;margin-top:20%;font-family:sans-serif;">
                <h1>Configuration Load Error</h1>
                <p style="color:#f87171;">${err.message}</p>
                <p style="color:#94a3b8;font-size:0.9em;">(Check Admin Console Logic or Database Rules)</p>
            </div>`;
    });

})();

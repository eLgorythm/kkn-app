// ==========================================
// CONFIGURATION FIREBASE
// Silakan sesuaikan dengan kredensial Firebase Anda
// ==========================================

// firebase-config.js
import { initializeApp } from "https://gstatic.com";
// Import layanan Firebase lain yang Anda butuhkan (contoh: Auth atau Firestore)
import { getAuth } from "https://gstatic.com";

	const firebaseConfig = {
          apiKey: "AIzaSyB96Oztmn8x5k7zeytEM8Ria3KzaDGRhwM",
          authDomain: "kknunsiq-613c1.firebaseapp.com",
          projectId: "kknunsiq-613c1",
          storageBucket: "kknunsiq-613c1.firebasestorage.app",
          messagingSenderId: "58429514757",
          appId: "1:58429514757:web:5f9046a87e77f15708e86c",
          measurementId: "G-RVPK4RHNLH"
        };

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Ekspor agar bisa digunakan di file lain

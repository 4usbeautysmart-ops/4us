// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgDlJi_VpPNGvLSVaGdDl7rhrAQeuLWsY",
  authDomain: "engenharia-de-cortes-5d.firebaseapp.com",
  projectId: "engenharia-de-cortes-5d",
  storageBucket: "engenharia-de-cortes-5d.appspot.com",
  messagingSenderId: "431702651144",
  appId: "1:431702651144:web:ea2a338dcc09b7e10b3cbd",
  measurementId: "G-0T5XDDM2XC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable Firestore offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // This can happen if multiple tabs are open.
      console.warn("Firestore persistence failed: Multiple tabs open. Offline capabilities will be limited.");
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence.
      console.warn("Firestore persistence failed: Browser does not support this feature.");
    }
  });

export { app, auth, db };
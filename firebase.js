import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
    getMessaging,
    getToken,
    onMessage
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging.js";
const firebaseConfig = {
    apiKey: "AIzaSyCpKl4I1rEvICuzYu4z0PWhAaGWbp6pdk0",
    authDomain: "kassa-prokat.firebaseapp.com",
    projectId: "kassa-prokat",
    storageBucket: "kassa-prokat.firebasestorage.app",
    messagingSenderId: "768484414005",
    appId: "1:768484414005:web:4446da880b4e6dd98e577c"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const db = getFirestore(app);

export {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
};
importScripts(
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyCpKl4I1rEvICuzYu4z0PWhAaGWbp6pdk0",
    authDomain: "kassa-prokat.firebaseapp.com",
    projectId: "kassa-prokat",
    storageBucket: "kassa-prokat.firebasestorage.app",
    messagingSenderId: "768484414005",
    appId: "1:768484414005:web:4446da880b4e6dd98e577c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

    console.log(
        "[firebase-messaging-sw.js] Background message:",
        payload
    );

    const title =
        payload.notification?.title ||
        "Тут Весело";

    const options = {
        body:
            payload.notification?.body ||
            "Новое уведомление",

        icon: "/icons/icon-192.png",

        badge: "/icons/icon-192.png"
    };

    self.registration.showNotification(
        title,
        options
    );

});
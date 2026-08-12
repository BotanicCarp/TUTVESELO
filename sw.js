self.addEventListener("install", () => {
    console.log("Service Worker установлен");
});

self.addEventListener("activate", () => {
    console.log("Service Worker активирован");
});
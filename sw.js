const CACHE = "myantyping-v4";
const FILES = [
  "/", 
  "/index.html",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css",
  "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});

self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request)));
});
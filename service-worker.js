const CACHE="lila-v11";
const FILES=[
  "./","./index.html","./manifest.webmanifest",
  "./assets/css/app.css","./assets/css/mobile-fit.css","./assets/css/mobile-device.css","./assets/css/games-extra.css",
  "./assets/js/app.js","./assets/js/data.js","./assets/js/letter-catalog.js","./assets/js/shapes.js","./assets/js/utils.js","./assets/js/voice.js","./assets/js/cloud-ai.js",
  "./games/manifest.js","./games/discover/plugin.js","./games/find-image/plugin.js","./games/find-letter/plugin.js","./games/tracing/plugin.js",
  "./games/count/plugin.js","./games/recognize-number/plugin.js","./games/shapes/plugin.js","./games/shadows/plugin.js","./games/shape-hole/plugin.js","./games/shape-rotation/plugin.js","./games/gender/plugin.js","./games/smart/plugin.js"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match("./index.html"))));
});

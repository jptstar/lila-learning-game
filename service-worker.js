const CACHE="lila-v18";
const FILES=[
  "./","./index.html","./manifest.webmanifest",
  "./assets/css/app.css","./assets/css/mobile-fit.css","./assets/css/mobile-device.css","./assets/css/games-extra.css",
  "./assets/js/app.js","./assets/js/data.js","./assets/js/letter-catalog.js","./assets/js/shapes.js","./assets/js/utils.js","./assets/js/voice.js","./assets/js/cloud-ai.js",
  "./games/manifest.js","./games/discover/plugin.js","./games/find-image/plugin.js","./games/find-letter/plugin.js","./games/tracing/plugin.js",
  "./games/count/plugin.js","./games/recognize-number/plugin.js","./games/shapes/plugin.js","./games/shadows/plugin.js","./games/shape-hole/plugin.js","./games/shape-rotation/plugin.js","./games/gender/plugin.js","./games/smart/plugin.js"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

function shouldUseNetworkFirst(request){
  if(request.mode==="navigate")return true;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return false;
  return /\.(?:html|js|css|webmanifest)$/.test(url.pathname);
}

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:"no-store"});
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  }catch{
    const cached=await caches.match(request);
    if(cached)return cached;
    if(request.mode==="navigate")return caches.match("./index.html");
    throw new Error("Ressource indisponible hors ligne");
  }
}

async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response&&response.ok){
    const cache=await caches.open(CACHE);
    cache.put(request,response.clone());
  }
  return response;
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(shouldUseNetworkFirst(event.request)?networkFirst(event.request):cacheFirst(event.request));
});

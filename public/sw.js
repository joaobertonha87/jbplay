const CACHE='jb-play-aula-na-mao-v34-20260901';
const CORE=['./index.html?v=3400','./treino.html?v=3400','./scout.html?v=3400','./manifest.webmanifest?v=3400'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const isApp=/\.(?:html|js|webmanifest)$/i.test(url.pathname)||url.pathname.endsWith('/');
  if(isApp){
    event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html?v=3400'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;
  })));
});

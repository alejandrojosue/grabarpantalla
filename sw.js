;
//asignar un nombre y version del cache
const CACHE_NAME = 'v1_cache_programador_web',
    urlsToCache = [
        /*ARCHIVOS O ENLACES A GUARDAR EN LA CACHE*/
        './',
        './css/style.css',
        './main.js',
        './index.html',
    ]

//EVENTOS DEL SERVICE WORKER

//durante la fase de instalación, generalmente se almacena en caché los activos estáticos
self.addEventListener('install', (e) => {
    console.log('[ServiceWorker] installed')
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('achivos precargados');
            return cache.addAll(urlsToCache);

        })
        .catch(err => console.log('Falló registro de cache', err))
    )
})

//una vez que se instala el SW, se activa y busca los recursos para hacer que funcione sin conexión
self.addEventListener('activate', e => {
    const cacheWhitelist = [CACHE_NAME]

    e.waitUntil(
        caches.keys()
        .then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    //Eliminamos lo que ya no se necesita en cache
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName)
                    }
                })
            )
        })
        // Le indica al SW activar el cache actual
        .then(() => self.clients.claim())
    )
})

//cuando el navegador recupera una url
self.addEventListener('fetch', e => {
    //Responder ya sea con el objeto en caché o continuar y buscar la url real
    e.respondWith(
        caches.match(e.request)
        .then(res => {
            if (res) {
                //recuperar del cache
                return res
            }
            //recuperar de la petición a la url
            return fetch(e.request)
        })
    )
})
const CACHE_NAME = "palestra-v10";

const FILE_DA_SALVARE = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icona-palestra.svg"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILE_DA_SALVARE))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((nomiCache) =>
      Promise.all(
        nomiCache
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") {
    return;
  }

  evento.respondWith(
    fetch(evento.request)
      .then((risposta) => {
        const copiaRisposta = risposta.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(evento.request, copiaRisposta);
        });

        return risposta;
      })
      .catch(() =>
        caches.match(evento.request).then(
          (rispostaInCache) => rispostaInCache || caches.match("./")
        )
      )
  );
});
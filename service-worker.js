const CACHE_NAME = 'odontoforense-cache-v1'; // Nome versionado do cache

const urlsToCache = [
  '/', // A raiz, geralmente seu index.html
  '/index.html', // Página de login
  '/manifest.json',
  '/css/style.css', // Seu CSS principal
  '/js/utils/authHelper.js', // Se você tem o helper
  '/js/app.js', // Script da página de login (ou como se chamar)
  '/js/home.js', // Script da home geral
  '/js/pericia.js', // Script dos detalhes do caso
  '/js/auditlog.js', // Script dos logs
  '/js/gerenciar_func.js', // Script de gerenciar funcionários
  '/main/home.html',
  '/components/home.html', // Home do Admin
  '/components/dashboard.html',
  '/components/cadastro.html',
  '/components/createCase.html',
  '/components/gerenciar_func.html',
  '/components/gerenciar_perms1.html',
  '/components/logs.html',
  '/components/perfil.html',
  '/components/pericia.html',
  '/main/pericia.html', // Estrutura da página de perícia
  '/main/consultaCase.html',
  '/main/cases.html',
  '/main/crateCase.html',
  '/main/perfil.html',
  '/main/js/utils/authHelper.js',
  '/main/js/cases.js',
  '/main/js/consultaCase.js',
  '/main/js/createCase.js',
  '/main/js/home.js',
  '/main/js/perfil.js',
  '/main/js/pericia.js',
  '/img/icon.png',
  '/img/favicon/android-chrome-192x192.png',
  '/img/favicon/android-chrome-512x512.png',
  '/img/default_icon.png',
  '/img/add_icon.png',
];

// Evento 'install': Cacheia os arquivos do App Shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Abrindo cache e adicionando App Shell:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] App Shell cacheado com sucesso.');
         return self.skipWaiting();
      })
      .catch(error => {
          console.error('[Service Worker] Falha ao cachear App Shell durante a instalação:', error);
      })
  );
});

// Evento 'activate': Limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  const cacheWhitelist = [CACHE_NAME]; // Lista de caches a manter (apenas o atual)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
         console.log('[Service Worker] Ativado e caches antigos limpos.');
         return self.clients.claim();
    })
  );
});

// Evento 'fetch': Intercepta requisições e decide como responder (Cache ou Rede)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Trata requisições para a API (/api/) separadamente: Network-Only
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
             console.error('[Service Worker] Erro ao buscar API:', event.request.url, error);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request) // Procura no cache
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
            .then(networkResponse => {
                return networkResponse; // Retorna a resposta da rede
            })
            .catch(error => {
                 console.error('[Service Worker] Erro ao buscar na rede (após cache miss):', event.request.url, error);
            });
      })
  );
});
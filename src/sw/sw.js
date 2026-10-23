// The offline worker: the whole field guide reads with no connection.
// Same safety rules as chaalwise's worker (after SaralCare's 10 June 2026 incident):
// - pages are fetched network-first, so a new deploy is seen at once when online;
// - only content-hashed build files are served from the cache, and only a copy
//   whose content type fits the file (never an HTML error page for a stylesheet);
// - everything else (the MCP endpoint, POSTs, analytics) goes to the network.
// There is no reader state to protect, so a new version takes over at once.
// Each version keeps its build files in its own cache, and the one before is kept
// too: Pages serves only the current deploy's files, so a tab still on the old
// version would otherwise fail to load one of its files after an update.
// The build prepends `self.__PRECACHE__`; see precache.ts.

const { version, pages, assets } = self.__PRECACHE__;
const PAGES = `pages-${version}`;
const ASSETS = `assets-${version}`;
// Earlier workers kept every version's build files in one cache, named `assets`.
const isAssetCache = (name) => name === "assets" || name.startsWith("assets-");
const FONTS = "fonts";
const OFFLINE = "/offline/";

const isHashedAsset = (path) =>
  /^\/_astro\/[^/]+\.[\w-]{8}\.[a-z0-9]+$/.test(path);
const TYPES = { css: /^text\/css\b/, js: /^(text|application)\/javascript\b/ };
const typeMatches = (path, type) =>
  !!type && !!TYPES[path.split(".").pop()]?.test(type);
// One key per page: /about, /about/ and /about/?x are all /about/.
const pageKey = (url) => {
  const { pathname } = new URL(url);
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
};
// Bypass the HTTP cache, so precaching never stores a stale copy.
const fresh = (path) => new Request(path, { cache: "reload" });

/** A copy of a build file from any version's cache, if its type fits. */
async function savedAsset(path) {
  const cached =
    (await caches.match(path, { cacheName: ASSETS })) ??
    (await caches.match(path));
  return cached && typeMatches(path, cached.headers.get("content-type"))
    ? cached
    : undefined;
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const assetCache = await caches.open(ASSETS);
      await Promise.all(
        assets.map(async (path) => {
          // Unchanged build files are copied from the last version, not downloaded again.
          const have = await savedAsset(path);
          await (have
            ? assetCache.put(path, have)
            : assetCache.add(fresh(path)));
        }),
      );
      await (await caches.open(PAGES)).addAll(pages.map(fresh));
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const oldPages = names.filter(
        (k) => k.startsWith("pages-") && k !== PAGES,
      );
      // Keep this version's build files and the one before (caches.keys() is in creation order).
      const oldAssets = names
        .filter((k) => isAssetCache(k) && k !== ASSETS)
        .slice(0, -1);
      await Promise.all(
        [...oldPages, ...oldAssets].map((k) => caches.delete(k)),
      );
      // Start the page request while the worker boots, instead of after.
      await self.registration.navigationPreload?.enable();
      await self.clients.claim();
    })(),
  );
});

async function page(event) {
  const key = pageKey(event.request.url);
  try {
    const response =
      (await event.preloadResponse) ?? (await fetch(event.request));
    if (
      response.ok &&
      response.headers.get("content-type")?.startsWith("text/html")
    ) {
      const copy = response.clone();
      // A full disk only means this copy isn't saved.
      event.waitUntil(
        caches
          .open(PAGES)
          .then((c) => c.put(key, copy))
          .catch(() => {}),
      );
    }
    return response;
  } catch {
    const cached = await caches.match(key, { cacheName: PAGES });
    if (cached) return cached;
    const offline = await caches.match(OFFLINE, { cacheName: PAGES });
    return new Response(offline ? offline.body : "You are offline.", {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}

async function asset(request, path) {
  const cached = await savedAsset(path);
  if (cached) return cached;
  const response = await fetch(request, { cache: "no-cache" });
  if (response.ok && typeMatches(path, response.headers.get("content-type"))) {
    await (await caches.open(ASSETS)).put(path, response.clone());
  }
  return response;
}

// Google Fonts, so the brand type also works offline. Font files live at
// versioned URLs, so a saved copy is used first; the stylesheet can change, so
// it comes from the network when online. Each is saved as it loads.
async function font(request, fileFirst) {
  const cache = await caches.open(FONTS);
  const cached = await cache.match(request);
  if (cached && fileFirst) return cached;
  try {
    const response = await fetch(request);
    // The stylesheet <link> is crossorigin, so this is a readable response, not an opaque one.
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    if (request.mode === "navigate") event.respondWith(page(event));
    else if (isHashedAsset(url.pathname))
      event.respondWith(asset(request, url.pathname));
  } else if (url.hostname === "fonts.gstatic.com") {
    event.respondWith(font(request, true));
  } else if (url.hostname === "fonts.googleapis.com") {
    event.respondWith(font(request, false));
  }
  // Anything else goes straight to the network, uncached.
});

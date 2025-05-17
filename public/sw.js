// This is the service worker for the Mobil Oil App

const CACHE_NAME = "mobil-oil-app-v1"

// Function to determine the base path
const getBasePath = () => {
  // Check if we're on the production domain or path
  const isProduction =
    self.location.hostname === "hussainienterprises.com" || self.location.pathname.includes("/MobilOilApp")
  return isProduction ? "/MobilOilApp" : ""
}

// URLs to cache - we'll add the base path dynamically when caching
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
   "/icons/icon-192x192.png",
  "/icons/icon-192x192.png",
  "/dashboard/",
  "/dashboard/index.html",
]

// Install a service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      // Add base path to each URL
      const basePath = getBasePath()
      const urlsWithBasePath = urlsToCache.map((url) => `${basePath}${url}`)
      return cache.addAll(urlsWithBasePath)
    }),
  )
})

// Cache and return requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }),
  )
})

// Update a service worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
          return null
        }),
      )
    }),
  )
})

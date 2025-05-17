// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Get the base path dynamically - this handles both development and production
    const basePath = window.location.pathname.startsWith("/MobilOilApp") ? "/MobilOilApp" : ""

    // Use absolute path with basePath
    navigator.serviceWorker
      .register(`${basePath}/sw.js`)
      .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope)
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error)
      })
  })
}

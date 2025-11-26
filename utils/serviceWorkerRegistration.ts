
export function register() {
  if ('serviceWorker' in navigator) {
    // Reverting to the 'load' event, but wrapping the registration in a timeout.
    // This is a common technique to resolve tricky race conditions by pushing the
    // execution to the end of the event loop, giving the browser a final moment
    // to stabilize the document's state before we attempt registration.
    window.addEventListener('load', () => {
      setTimeout(() => {
        const swUrl = `${window.location.origin}/sw.js`;
        navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            console.log('Service Worker registered via timeout on load with scope:', registration.scope);
        })
        .catch((error) => {
            console.error(`Failed to register Service Worker via timeout on load with URL: ${swUrl}`, error);
        });
      }, 0);
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
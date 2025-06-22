// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/firebase-messaging-sw.js')
            .then((registration) => {
                console.log('SW registered successfully: ', registration);
            })
            .catch((registrationError) => {
                console.error('SW registration failed: ', registrationError);
            });
    });
} 
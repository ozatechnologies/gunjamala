// Push Manager for Gunjamala Notifier
class PushManager {
    constructor() {
        this.publicVapidKey = 'BLjB8n1wPJ4hTIBUu0XjvJZ8X8Z4X7W9a9X8n4vJ7XZ9jK8vQ1wE9rT6yH8jK9lP3vB4n';
        this.subscription = null;
        this.serviceWorkerRegistration = null;
        
        // Initialize when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    async initialize() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser');
            return;
        }
        
        try {
            // Register service worker
            this.serviceWorkerRegistration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered');
            
            // Check subscription status
            this.subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
            
            // If not subscribed, request permission and subscribe
            if (!this.subscription) {
                await this.requestNotificationPermission();
                await this.subscribeToPush();
            } else {
                console.log('Already subscribed to push notifications');
            }
        } catch (error) {
            console.error('Error initializing push notifications:', error);
        }
    }
    
    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Permission not granted for Notifications');
            }
            console.log('Notification permission granted');
            return true;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }
    
    async subscribeToPush() {
        try {
            const applicationServerKey = this.urlBase64ToUint8Array(this.publicVapidKey);
            this.subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            
            console.log('Push subscription successful');
            return true;
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            return false;
        }
    }
    
    // Helper function to convert base64 string to Uint8Array
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    
    // Schedule a push notification
    async scheduleNotification(title, body, time) {
        if (!this.subscription) {
            console.warn('Not subscribed to push notifications');
            return false;
        }
        
        try {
            // In a real app, you would send this to your server
            // For this example, we'll schedule it locally
            const now = new Date();
            const targetTime = new Date(time);
            const delay = targetTime - now;
            
            if (delay <= 0) {
                console.warn('Cannot schedule notification in the past');
                return false;
            }
            
            console.log(`Scheduling notification for ${targetTime}`);
            
            // In a real app, you would send the subscription to your server
            // and the server would send the push notification at the scheduled time
            // For this example, we'll use a timeout (which won't work when the app is closed)
            // In a production app, you would need a server to handle the scheduling
            
            // This is just a fallback for when push notifications aren't available
            // The service worker will handle the actual push notifications
            setTimeout(() => {
                this.showLocalNotification(title, body);
            }, delay);
            
            return true;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return false;
        }
    }
    
    // Show a local notification (fallback)
    showLocalNotification(title, body) {
        if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: body,
                    icon: 'icon-192x192.png',
                    vibrate: [200, 100, 200],
                    tag: 'gunjamala-notification',
                    renotify: true
                });
            });
        }
    }
}

// Initialize Push Manager when the script loads
const pushManager = new PushManager();

// Export for use in other files
window.pushManager = pushManager;

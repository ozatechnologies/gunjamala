// Push Manager for Gunjamala Notifier
class PushManager {
    constructor() {
        // VAPID public key - in a production app, this should be stored securely
        this.publicVapidKey = 'BLjB8n1wPJ4hTIBUu0XjvJZ8X8Z4X7W9a9X8n4vJ7XZ9jK8vQ1wE9rT6yH8jK9lP3vB4n';
        this.subscription = null;
        this.serviceWorkerRegistration = null;
        
        // Bind methods to maintain 'this' context
        this.initialize = this.initialize.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
        this.requestNotificationPermission = this.requestNotificationPermission.bind(this);
        this.subscribeToPush = this.subscribeToPush.bind(this);
        this.urlBase64ToUint8Array = this.urlBase64ToUint8Array.bind(this);
        this.scheduleNotification = this.scheduleNotification.bind(this);
        this.showLocalNotification = this.showLocalNotification.bind(this);
        this.testNotification = this.testNotification.bind(this);
        
        // Initialize when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    async initialize() {
        if (!('serviceWorker' in navigator)) {
            this.updateStatus('Service workers are not supported in this browser');
            return;
        }

        if (!('PushManager' in window)) {
            this.updateStatus('Push notifications are not supported in this browser');
            return;
        }
        
        try {
            // Register service worker
            console.log('Registering service worker...');
            this.serviceWorkerRegistration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered with scope:', this.serviceWorkerRegistration.scope);
            
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            
            // Check subscription status
            this.subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
            
            // If not subscribed, request permission and subscribe
            if (!this.subscription) {
                console.log('No existing subscription found, requesting permission...');
                const permissionGranted = await this.requestNotificationPermission();
                if (permissionGranted) {
                    await this.subscribeToPush();
                }
            } else {
                console.log('Already subscribed to push notifications');
                this.updateStatus('Push notifications are enabled');
            }
        } catch (error) {
            console.error('Error initializing push notifications:', error);
            this.updateStatus('Error: ' + error.message);
        }
    }
    
    updateStatus(message) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        }
    }
    
    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted');
                return true;
            } else if (permission === 'denied') {
                console.warn('Notification permission denied');
                this.updateStatus('Notifications are blocked. Please enable them in your browser settings.');
                return false;
            } else {
                console.warn('Notification permission dismissed');
                this.updateStatus('Please enable notifications to receive alerts');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            this.updateStatus('Error requesting notification: ' + error.message);
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
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return;
        }
        
        if (Notification.permission === 'granted') {
            // Try to show a notification using the service worker
            if (this.serviceWorkerRegistration) {
                this.serviceWorkerRegistration.showNotification(title, {
                    body: body,
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    data: {
                        url: '/',
                        timestamp: Date.now()
                    }
                }).catch(err => {
                    console.warn('Error showing notification via service worker:', err);
                    // Fallback to regular notification
                    new Notification(title, { 
                        body: body,
                        icon: '/icon-192x192.png'
                    });
                });
            } else {
                // Fallback to regular notification if service worker is not available
                new Notification(title, { 
                    body: body,
                    icon: '/icon-192x192.png'
                });
            }
        } else if (Notification.permission !== 'denied') {
            // Request permission if not already denied
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showLocalNotification(title, body);
                }
            });
        }
    }
    
    // Test notification
    async testNotification() {
        try {
            this.updateStatus('Sending test notification...');
            await this.showLocalNotification(
                'Test Notification', 
                'This is a test notification from Gunjamala Notifier.'
            );
            this.updateStatus('Test notification sent!');
            return true;
        } catch (error) {
            console.error('Error sending test notification:', error);
            this.updateStatus('Error sending test notification: ' + error.message);
            return false;
        }
    }
}

// Initialize Push Manager when the script loads
const pushManager = new PushManager();

// Export for use in other files
window.pushManager = pushManager;

document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    const enableButton = document.getElementById('enableNotifications');
    const testButton = document.getElementById('testNotification');
    const nextNotificationElement = document.getElementById('nextNotification');
    
    // Check if browser supports notifications
    if (!('Notification' in window)) {
        statusElement.textContent = 'This browser does not support desktop notifications';
        statusElement.style.backgroundColor = '#ffebee';
        statusElement.style.color = '#c62828';
        return;
    }

    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }

    // Request notification permission
    function requestNotificationPermission() {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                statusElement.textContent = 'Notifications enabled! You will be notified at 6 AM, 8 AM, and 10 AM IST.';
                statusElement.style.backgroundColor = '#e8f5e9';
                statusElement.style.color = '#2e7d32';
                updateNextNotificationTime();
                
                // Schedule notifications for the day
                scheduleDailyNotifications();
            } else {
                statusElement.textContent = 'Notifications are blocked. Please enable them in your browser settings.';
                statusElement.style.backgroundColor = '#fff3e0';
                statusElement.style.color = '#e65100';
            }
        });
    }

    // Show test notification
    function showTestNotification() {
        if (Notification.permission === 'granted') {
            const notification = new Notification('Gunjamala Test', {
                body: 'This is a test notification for Gunjamala!',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                vibrate: [200, 100, 200]
            });
        } else {
            statusElement.textContent = 'Please enable notifications first';
        }
    }

    // Calculate next notification time
    function updateNextNotificationTime() {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
        const istTime = new Date(now.getTime() + (istOffset + now.getTimezoneOffset() * 60 * 1000));
        
        const hours = istTime.getUTCHours();
        const minutes = istTime.getUTCMinutes();
        
        // Define notification times (6:00, 8:00, 10:00 IST)
        const notificationTimes = [6, 8, 10];
        let nextTime = null;
        
        // Find the next notification time
        for (const time of notificationTimes) {
            if (hours < time || (hours === time && minutes < 1)) {
                nextTime = new Date(istTime);
                nextTime.setUTCHours(time, 0, 0, 0);
                break;
            }
        }
        
        // If no more notifications today, set for first time tomorrow
        if (!nextTime) {
            nextTime = new Date(istTime);
            nextTime.setUTCDate(nextTime.getUTCDate() + 1);
            nextTime.setUTCHours(notificationTimes[0], 0, 0, 0);
        }
        
        // Convert back to local time for display
        const localNextTime = new Date(nextTime.getTime() - (istOffset + now.getTimezoneOffset() * 60 * 1000));
        const options = { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' };
        nextNotificationElement.textContent = localNextTime.toLocaleTimeString('en-IN', options);
    }

    // Schedule daily notifications using Background Sync API
    function scheduleDailyNotifications() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                // Register for periodic sync (this is a new API and might not be widely supported)
                if ('periodicSync' in registration) {
                    registration.periodicSync.register('gunjamala-notification', {
                        minInterval: 24 * 60 * 60 * 1000 // 24 hours
                    }).then(() => {
                        console.log('Periodic sync registered');
                    }).catch(err => {
                        console.log('Periodic sync registration failed:', err);
                    });
                }
            });
        }
    }


    // Event listeners
    enableButton.addEventListener('click', requestNotificationPermission);
    testButton.addEventListener('click', showTestNotification);

    // Check current notification permission
    if (Notification.permission === 'granted') {
        statusElement.textContent = 'Notifications are enabled! You will be notified at 6 AM, 8 AM, and 10 AM IST.';
        statusElement.style.backgroundColor = '#e8f5e9';
        statusElement.style.color = '#2e7d32';
        updateNextNotificationTime();
    } else if (Notification.permission !== 'denied') {
        statusElement.textContent = 'Click the button to enable notifications.';
        statusElement.style.backgroundColor = '#fff3e0';
        statusElement.style.color = '#e65100';
    } else {
        statusElement.textContent = 'Notifications are blocked. Please enable them in your browser settings.';
        statusElement.style.backgroundColor = '#ffebee';
        statusElement.style.color = '#c62828';
    }

    // Update next notification time every minute
    setInterval(updateNextNotificationTime, 60000);
});

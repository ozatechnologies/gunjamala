document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const statusElement = document.getElementById('status');
    const enableButton = document.getElementById('enableNotifications');
    const testButton = document.getElementById('testNotification');
    const addButton = document.getElementById('addNotification');
    const timeInput = document.getElementById('customTime');
    const nextNotificationElement = document.getElementById('nextNotification');
    const scheduledList = document.getElementById('scheduledList');
    const notificationList = document.getElementById('notificationList');
    
    // State
    let scheduledTimes = [];
    let notificationTimers = {};
    const NOTIFICATION_STORAGE_KEY = 'gunjamala_notification_times';
    const NOTIFICATION_HISTORY_KEY = 'gunjamala_notification_history';
    
    // Initialize the application
    function init() {
        loadScheduledTimes();
        renderNotificationHistory();
        setupEventListeners();
        checkNotificationPermission();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        enableButton.addEventListener('click', requestNotificationPermission);
        testButton.addEventListener('click', showTestNotification);
        addButton.addEventListener('click', handleAddTime);
        
        // Handle Enter key in time input
        timeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAddTime();
            }
        });
    }
    
    // Check current notification permission
    function checkNotificationPermission() {
        if (Notification.permission === 'granted') {
            updateStatus('Notifications are enabled!', 'success');
            loadScheduledTimes();
        } else if (Notification.permission === 'denied') {
            updateStatus('Notifications are blocked. Please enable them in your browser settings.', 'error');
        } else {
            updateStatus('Click the button to enable notifications.', 'info');
        }
    }
    
    // Request notification permission
    function requestNotificationPermission() {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                updateStatus('Notifications enabled! Add times to get started.', 'success');
                loadScheduledTimes();
            } else {
                updateStatus('Notifications are blocked. Please enable them in your browser settings.', 'error');
            }
        });
    }
    
    // Show a notification
    function showNotification(title, options = {}) {
        console.log('Attempting to show notification:', title, options);
        
        if (Notification.permission !== 'granted') {
            console.warn('Cannot show notification: Notification permission not granted');
            return null;
        }
        
        try {
            const notification = new Notification(title, {
                icon: 'icon-192x192.png',
                badge: 'icon-192x192.png',
                vibrate: [200, 100, 200],
                requireInteraction: true,
                ...options
            });
            
            console.log('Notification shown successfully');
            
            // Add to history
            addToHistory(options.body || title);
            
            // Play notification sound
            playNotificationSound();
            
            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }
    
    // Play notification sound
    function playNotificationSound() {
        try {
            // Create a simple notification sound using the Web Audio API
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.stop(audioCtx.currentTime + 0.5);
            
            console.log('Played notification sound');
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }
    
    // Show test notification
    function showTestNotification() {
        if (Notification.permission !== 'granted') {
            updateStatus('Please enable notifications first', 'warning');
            return;
        }
        
        showNotification('Gunjamala Test', {
            body: 'This is a test notification for Gunjamala!',
            requireInteraction: true
        });
        
        updateStatus('Test notification sent!', 'success');
    }
    
    // Handle adding a new time
    function handleAddTime() {
        const timeValue = timeInput.value.trim();
        if (!timeValue) return;
        
        // Format time to HH:MM
        const [hours, minutes] = timeValue.split(':');
        const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        
        // Validate time
        if (scheduledTimes.includes(formattedTime)) {
            updateStatus(`Time ${formattedTime} is already scheduled`, 'warning');
            return;
        }
        
        // Add to scheduled times
        scheduledTimes.push(formattedTime);
        scheduledTimes.sort(); // Keep times in order
        
        // Save and update UI
        saveScheduledTimes();
        renderScheduledTimes();
        scheduleAllNotifications();
        
        // Reset input
        timeInput.value = '';
        updateStatus(`Added notification for ${formattedTime}`, 'success');
    }
    
    // Remove a scheduled time
    function removeScheduledTime(time) {
        scheduledTimes = scheduledTimes.filter(t => t !== time);
        saveScheduledTimes();
        renderScheduledTimes();
        scheduleAllNotifications();
        
        updateStatus(`Removed scheduled time: ${time}`, 'success');
    }
    
    // Render scheduled times
    function renderScheduledTimes() {
        scheduledList.innerHTML = '';
        
        if (scheduledTimes.length === 0) {
            scheduledList.innerHTML = '<div class="notification-item">No scheduled times. Add one above.</div>';
            return;
        }
        
        scheduledTimes.forEach(time => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.innerHTML = `
                <span>${time}</span>
                <button class="danger" data-time="${time}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            `;
            
            // Add click handler to remove button
            item.querySelector('button').addEventListener('click', (e) => {
                e.stopPropagation();
                removeScheduledTime(time);
            });
            
            scheduledList.appendChild(item);
        });
    }
    
    // Render notification history
    function renderNotificationHistory() {
        const history = JSON.parse(localStorage.getItem(NOTIFICATION_HISTORY_KEY) || '[]');
        
        if (history.length === 0) {
            notificationList.innerHTML = '<div class="notification-item">No notification history yet.</div>';
            return;
        }
        
        notificationList.innerHTML = history.map(entry => `
            <div class="notification-item">
                <div>
                    <div>${entry.message}</div>
                    <div class="notification-time">${new Date(entry.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Add a notification to history
    function addToHistory(message) {
        const history = JSON.parse(localStorage.getItem(NOTIFICATION_HISTORY_KEY) || '[]');
        const now = new Date();
        
        // Add new entry to the beginning of the array
        history.unshift({
            message,
            timestamp: now.toISOString()
        });
        
        // Keep only the last 50 entries
        if (history.length > 50) {
            history.pop();
        }
        
        // Save to localStorage
        localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history));
        
        // Update the UI
        renderNotificationHistory();
    }
    
    // Schedule all notifications
    function scheduleAllNotifications() {
        // Clear all existing timers
        Object.values(notificationTimers).forEach(timerId => {
            clearTimeout(timerId);
        });
        notificationTimers = {};
        
        if (scheduledTimes.length === 0) {
            nextNotificationElement.textContent = '--:--';
            return;
        }
        
        const now = new Date();
        let nextTime = null;
        let minDiff = Infinity;
        
        // Find the next upcoming notification time
        scheduledTimes.forEach(time => {
            const [hours, minutes] = time.split(':').map(Number);
            const notificationTime = new Date(now);
            notificationTime.setHours(hours, minutes, 0, 0);
            
            // If the time has already passed today, schedule for tomorrow
            if (notificationTime <= now) {
                notificationTime.setDate(notificationTime.getDate() + 1);
            }
            
            const diff = notificationTime - now;
            
            if (diff < minDiff) {
                minDiff = diff;
                nextTime = notificationTime;
            }
            
            // Schedule this notification
            scheduleNotification(notificationTime, time);
        });
        
        // Update the next notification time display
        if (nextTime) {
            const options = { hour: '2-digit', minute: '2-digit', hour12: true };
            nextNotificationElement.textContent = nextTime.toLocaleTimeString('en-IN', options);
        } else {
            nextNotificationElement.textContent = '--:--';
        }
    }
    
    // Schedule a single notification
    function scheduleNotification(notificationTime, timeString) {
        const now = new Date();
        const timeUntil = notificationTime - now;
        
        // Don't schedule if the time has already passed
        if (timeUntil <= 0) return;
        
        const timerId = setTimeout(() => {
            // Show the notification
            showNotification('Gunjamala Time!', {
                body: `It's time for Gunjamala at ${timeString}`,
                requireInteraction: true
            });
            
            // Schedule the next occurrence (tomorrow)
            const nextDay = new Date(notificationTime);
            nextDay.setDate(nextDay.getDate() + 1);
            scheduleNotification(nextDay, timeString);
            
            // Update the next notification time
            scheduleAllNotifications();
            
        }, timeUntil);
        
        // Store the timer ID so we can clear it later
        notificationTimers[timeString] = timerId;
    }
    
    // Load scheduled times from localStorage
    function loadScheduledTimes() {
        const savedTimes = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (savedTimes) {
            scheduledTimes = JSON.parse(savedTimes);
            renderScheduledTimes();
            scheduleAllNotifications();
        }
    }
    
    // Save scheduled times to localStorage
    function saveScheduledTimes() {
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(scheduledTimes));
    }
    
    // Update status message
    function updateStatus(message, type = 'info') {
        let icon = 'info-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        if (type === 'success') icon = 'check-circle';
        
        statusElement.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        statusElement.className = 'status';
        if (type === 'error' || type === 'warning' || type === 'success') {
            statusElement.classList.add(type);
        }
    }
    
    // Initialize the app
    init();
});

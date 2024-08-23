document.addEventListener('DOMContentLoaded', () => {
    console.log('CleanCity App Initialized');
    // Initialize authentication
    initAuth();
    // Initialize reporting
    initReport();
    // Initialize admin panel
    initAdmin();
    // Initialize user profile
    initProfile();
    // Initialize notifications
    initNotifications();
    // Initialize analytics
    initAnalytics();
    // Initialize cleaning drives
    initDrives();
});

// Update current date and time
function updateDateTime() {
    const now = new Date();
    const dtEl = document.getElementById('currentDateTime');
    if (dtEl) dtEl.textContent = now.toLocaleString();
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    // Update time every minute
    setInterval(updateDateTime, 60000);
    
    // Focus on username field
    const userEl = document.getElementById('username');
    if (userEl) userEl.focus();
});

// Security: Clear sensitive data on page unload
window.addEventListener('beforeunload', function() {
    const pw = document.getElementById('password');
    if (pw) pw.value = '';
});

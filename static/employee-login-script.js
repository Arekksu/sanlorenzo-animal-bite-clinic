// Update current date and time
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    // Update time every minute
    setInterval(updateDateTime, 60000);
    
    // Focus on employee ID field
    document.getElementById('employeeId').focus();
});

// Handle employee login
function handleEmployeeLogin(event) {
    event.preventDefault();
    
    const employeeId = document.getElementById('employeeId').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('.login-btn');
    
    // Remove any existing error messages
    removeErrorMessage();
    
    // Basic validation
    if (!employeeId || !password) {
        showErrorMessage('Please fill in all fields');
        return;
    }
    
    // Show loading state
    showLoadingState(loginBtn);
    
    // Simulate authentication delay (for demo purposes)
    setTimeout(() => {
        // Demo credentials - replace with actual authentication system
        if (employeeId.toLowerCase() === 'admin' && password === 'admin123') {
            // Set user info in localStorage
            const loginTime = new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            // Determine user display name based on employee ID
            let userName = 'Admin User';
            if (employeeId.toLowerCase() === 'admin') {
                userName = 'Administrator';
            } else {
                // For other employee IDs, use a more user-friendly format
                userName = employeeId.charAt(0).toUpperCase() + employeeId.slice(1).toLowerCase();
            }
            
            localStorage.setItem('currentUser', userName);
            localStorage.setItem('loginTime', loginTime);
            
            showSuccessState(loginBtn);
            // Redirect to employee dashboard after success animation
            setTimeout(() => {
                window.location.href = 'employee-dashboard.html';
            }, 1500);
        } else {
            hideLoadingState(loginBtn);
            showErrorMessage('Invalid Employee ID or Password. Please try again.');
            
            // Clear password field for security
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
    }, 1000); // Simulate network delay
}

// Show loading state
function showLoadingState(button) {
    button.classList.add('loading');
    button.disabled = true;
}

// Hide loading state
function hideLoadingState(button) {
    button.classList.remove('loading');
    button.disabled = false;
}

// Show success state
function showSuccessState(button) {
    button.classList.remove('loading');
    button.style.background = '#28a745';
    button.innerHTML = '<span class="btn-text">✓ Login Successful!</span>';
    
    // Show success checkmark
    const checkmark = document.createElement('div');
    checkmark.className = 'success-checkmark show';
    button.parentNode.insertBefore(checkmark, button);
}

// Show error message
function showErrorMessage(message) {
    removeErrorMessage(); // Remove any existing error
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message show';
    errorDiv.textContent = message;
    
    const form = document.querySelector('.login-form');
    form.appendChild(errorDiv);
    
    // Auto-remove error after 5 seconds
    setTimeout(() => {
        removeErrorMessage();
    }, 5000);
}

// Remove error message
function removeErrorMessage() {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

// Handle Enter key navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const employeeIdField = document.getElementById('employeeId');
        const passwordField = document.getElementById('password');
        
        if (document.activeElement === employeeIdField) {
            passwordField.focus();
            event.preventDefault();
        }
    }
});

// Add some visual feedback for input fields
document.getElementById('employeeId').addEventListener('input', function() {
    removeErrorMessage();
});

document.getElementById('password').addEventListener('input', function() {
    removeErrorMessage();
});

// Prevent form submission on disabled state
document.querySelector('.login-form').addEventListener('submit', function(event) {
    if (document.querySelector('.login-btn').disabled) {
        event.preventDefault();
    }
});

// Add click handlers for demo credentials
document.querySelector('.demo-credentials').addEventListener('click', function() {
    document.getElementById('employeeId').value = 'admin';
    document.getElementById('password').value = 'admin123';
    document.getElementById('employeeId').focus();
});

// Security: Clear sensitive data on page unload
window.addEventListener('beforeunload', function() {
    document.getElementById('password').value = '';
});

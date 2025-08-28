// Current active tab and section
let currentTab = 0;
let currentSection = 'dashboard';

// Sample patient data for demonstration
let patientDatabase = [
    {
        registrationNumber: 'USL8YXX557',
        name: 'John Doe',
        age: 35,
        gender: 'Male',
        contact: '09123456789',
        address: '123 Main St, San Lorenzo',
        biteDate: '2024-08-07',
        biteLocation: 'Right arm',
        placeOfBite: 'Home',
        sourceOfBite: 'Cat',
        status: 'Active',
        nextAppointment: '2024-08-27'
    },
    {
        registrationNumber: 'USL9ABC123',
        name: 'Maria Santos',
        age: 28,
        gender: 'Female',
        contact: '09876543210',
        address: '456 Oak Ave, San Lorenzo',
        biteDate: '2024-08-15',
        biteLocation: 'Left leg',
        placeOfBite: 'Park',
        sourceOfBite: 'Dog',
        status: 'Active',
        nextAppointment: '2024-08-29'
    },
    {
        registrationNumber: 'USL7DEF456',
        name: 'Pedro Garcia',
        age: 42,
        gender: 'Male',
        contact: '09555123456',
        address: '789 Pine St, San Lorenzo',
        biteDate: '2024-08-10',
        biteLocation: 'Hand',
        placeOfBite: 'Street',
        sourceOfBite: 'Stray Dog',
        status: 'Completed',
        nextAppointment: 'N/A'
    },
    {
        registrationNumber: 'USL6GHI789',
        name: 'Ana Reyes',
        age: 31,
        gender: 'Female',
        contact: '09333654321',
        address: '321 Maple Dr, San Lorenzo',
        biteDate: '2024-08-20',
        biteLocation: 'Face',
        placeOfBite: 'Home',
        sourceOfBite: 'Cat',
        status: 'Active',
        nextAppointment: '2024-08-30'
    }
];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDate();
    generateRegistrationNumber();
    loadPatientTable();
    setupEmployeeSearchBar();
    initializeUserInfo();
});

// Update current date
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

// Generate random registration number
function generateRegistrationNumber() {
    const prefix = 'USL';
    const numbers = Math.floor(Math.random() * 900000) + 100000;
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                   String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                   String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const regNumber = prefix + numbers + letters;
    document.getElementById('registrationNumber').textContent = regNumber;
}

// Employee search functionality
function performEmployeeSearch() {
    const searchTerm = document.getElementById('employeeHeaderSearch').value.toLowerCase().trim();
    
    if (!searchTerm) {
        alert('Please enter a search term');
        return;
    }
    
    // Search through patient database
    const searchResults = patientDatabase.filter(patient => {
        return patient.name.toLowerCase().includes(searchTerm) ||
               patient.registrationNumber.toLowerCase().includes(searchTerm) ||
               patient.contact.includes(searchTerm) ||
               patient.address.toLowerCase().includes(searchTerm);
    });
    
    if (searchResults.length === 0) {
        alert(`No patients found for "${searchTerm}"`);
        return;
    }
    
    // Switch to view patient section and filter results
    showSection('view-patient');
    filterPatientTable(searchResults);
    
    // Show search results summary
    if (searchResults.length === 1) {
        alert(`Found 1 patient: ${searchResults[0].name} (${searchResults[0].registrationNumber})`);
    } else {
        alert(`Found ${searchResults.length} patients matching "${searchTerm}"`);
    }
    
    // Clear search bar
    document.getElementById('employeeHeaderSearch').value = '';
}

// Setup employee search bar
function setupEmployeeSearchBar() {
    const searchBar = document.getElementById('employeeHeaderSearch');
    if (searchBar) {
        searchBar.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                performEmployeeSearch();
            }
        });
    }
}

// Load patient table with data
function loadPatientTable() {
    const tableBody = document.querySelector('.patient-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    patientDatabase.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.registrationNumber}</td>
            <td>${patient.name}</td>
            <td>${patient.biteDate}</td>
            <td><span class="status-badge ${patient.status.toLowerCase()}">${patient.status}</span></td>
            <td>
                <button class="btn-small btn-primary" onclick="viewPatient('${patient.registrationNumber}')">View</button>
                <button class="btn-small btn-secondary" onclick="editPatient('${patient.registrationNumber}')">Edit</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Filter patient table based on search results
function filterPatientTable(filteredPatients) {
    const tableBody = document.querySelector('.patient-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    filteredPatients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.registrationNumber}</td>
            <td>${patient.name}</td>
            <td>${patient.biteDate}</td>
            <td><span class="status-badge ${patient.status.toLowerCase()}">${patient.status}</span></td>
            <td>
                <button class="btn-small btn-primary" onclick="viewPatient('${patient.registrationNumber}')">View</button>
                <button class="btn-small btn-secondary" onclick="editPatient('${patient.registrationNumber}')">Edit</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// View patient details
function viewPatient(registrationNumber) {
    const patient = patientDatabase.find(p => p.registrationNumber === registrationNumber);
    if (patient) {
        alert(`Patient Details:\n\nName: ${patient.name}\nAge: ${patient.age}\nGender: ${patient.gender}\nContact: ${patient.contact}\nAddress: ${patient.address}\nBite Date: ${patient.biteDate}\nBite Location: ${patient.biteLocation}\nSource: ${patient.sourceOfBite}\nStatus: ${patient.status}\nNext Appointment: ${patient.nextAppointment}`);
    }
}

// Edit patient (placeholder function)
function editPatient(registrationNumber) {
    alert(`Edit functionality for ${registrationNumber} would be implemented here`);
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Update menu buttons
    const menuButtons = document.querySelectorAll('.menu-btn');
    menuButtons.forEach(btn => btn.classList.remove('active'));
    
    // Find and activate the correct menu button
    const activeButton = Array.from(menuButtons).find(btn => 
        btn.textContent.toLowerCase().replace(' ', '-') === sectionName ||
        (sectionName === 'add-record' && btn.textContent === 'Add Record') ||
        (sectionName === 'view-patient' && btn.textContent === 'View Patient') ||
        (sectionName === 'view-schedule' && btn.textContent === 'View Schedule') ||
        (sectionName === 'dashboard' && btn.textContent === 'Dashboard')
    );
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    currentSection = sectionName;
}

// Show tab within add-record section
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Find and activate the correct tab button
    const activeTabButton = Array.from(tabButtons).find(btn => {
        const btnText = btn.textContent.toLowerCase();
        return (tabName === 'personal-info' && btnText.includes('personal')) ||
               (tabName === 'vaccine-bite-info' && btnText.includes('vaccine')) ||
               (tabName === 'schedule' && btnText.includes('schedule'));
    });
    
    if (activeTabButton) {
        activeTabButton.classList.add('active');
    }
    
    // Update current tab index
    const tabs = ['personal-info', 'vaccine-bite-info', 'schedule'];
    currentTab = tabs.indexOf(tabName);
}

// Select service type
function selectService(serviceType) {
    const serviceButtons = document.querySelectorAll('.service-btn');
    serviceButtons.forEach(btn => btn.classList.remove('active'));
    
    const activeButton = Array.from(serviceButtons).find(btn => {
        const btnText = btn.textContent.toLowerCase();
        return (serviceType === 'booster' && btnText.includes('booster')) ||
               (serviceType === 'pre-exposure' && btnText.includes('pre-exposure')) ||
               (serviceType === 'post-exposure' && btnText.includes('post-exposure'));
    });
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Navigation functions for tabs
function nextTab() {
    const tabs = ['personal-info', 'vaccine-bite-info', 'schedule'];
    if (currentTab < tabs.length - 1) {
        currentTab++;
        showTab(tabs[currentTab]);
    }
}

function previousTab() {
    const tabs = ['personal-info', 'vaccine-bite-info', 'schedule'];
    if (currentTab > 0) {
        currentTab--;
        showTab(tabs[currentTab]);
    }
}

// Save record function
function saveRecord() {
    // Collect form data
    const personalData = {
        name: document.getElementById('patientName').value,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        contact: document.getElementById('contact').value,
        address: document.getElementById('address').value
    };
    
    const biteData = {
        biteDate: document.getElementById('biteDate').value,
        biteLocation: document.getElementById('biteLocation').value,
        placeOfBite: document.getElementById('placeOfBite').value,
        typeOfBite: document.getElementById('typeOfBite').value,
        sourceOfBite: document.getElementById('sourceOfBite').value,
        otherSource: document.getElementById('otherSource').value,
        sourceStatus: document.getElementById('sourceStatus').value,
        exposure: document.getElementById('exposure').value,
        vaccinated: document.querySelector('input[name="vaccinated"]:checked').value
    };
    
    // Validate required fields
    if (!personalData.name || !personalData.age || !personalData.gender || !personalData.contact) {
        alert('Please fill in all required personal information fields.');
        showTab('personal-info');
        return;
    }
    
    if (!biteData.biteDate || !biteData.biteLocation) {
        alert('Please fill in all required bite information fields.');
        showTab('vaccine-bite-info');
        return;
    }
    
    // Simulate saving
    const registrationNumber = document.getElementById('registrationNumber').textContent;
    
    // Show success message
    alert(`Record saved successfully!\nRegistration Number: ${registrationNumber}\nPatient: ${personalData.name}`);
    
    // Reset form and generate new registration number
    resetForm();
    generateRegistrationNumber();
    
    // Go back to dashboard
    showSection('dashboard');
}

// Reset form
function resetForm() {
    document.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"], input[type="date"], textarea, select').forEach(field => {
        if (field.type === 'date') {
            field.value = new Date().toISOString().split('T')[0];
        } else {
            field.value = '';
        }
    });
    
    // Reset radio buttons
    document.querySelector('input[name="vaccinated"][value="yes"]').checked = true;
    
    // Reset service buttons
    selectService('post-exposure');
    
    // Go back to first tab
    showTab('personal-info');
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Redirect to employee login page
        window.location.href = 'employee-login.html';
    }
}

// Search functionality
function searchPatients() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    
    if (!searchTerm) {
        loadPatientTable(); // Show all patients if search is empty
        return;
    }
    
    const searchResults = patientDatabase.filter(patient => {
        return patient.name.toLowerCase().includes(searchTerm) ||
               patient.registrationNumber.toLowerCase().includes(searchTerm) ||
               patient.contact.includes(searchTerm);
    });
    
    filterPatientTable(searchResults);
}

// Add event listener for search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', searchPatients);
    }
});

// Auto-calculate vaccination dates
document.addEventListener('DOMContentLoaded', function() {
    const biteDateInput = document.getElementById('biteDate');
    if (biteDateInput) {
        biteDateInput.addEventListener('change', function() {
            const biteDate = new Date(this.value);
            if (!isNaN(biteDate.getTime())) {
                updateVaccinationSchedule(biteDate);
            }
        });
    }
});

function updateVaccinationSchedule(biteDate) {
    const scheduleInputs = {
        'day0': 0,
        'day3': 3,
        'day7': 7,
        'day14': 14,
        'day28': 28
    };
    
    Object.entries(scheduleInputs).forEach(([inputName, daysToAdd]) => {
        const input = document.querySelector(`input[name="${inputName}"]`);
        if (input) {
            const scheduleDate = new Date(biteDate);
            scheduleDate.setDate(scheduleDate.getDate() + daysToAdd);
            input.value = scheduleDate.toISOString().split('T')[0];
        }
    });
}

// Print functionality
function printRecord() {
    window.print();
}

// Export functionality
function exportRecord() {
    // This would typically generate a PDF or Excel file
    alert('Export functionality would be implemented here');
}

// Complete vaccination
function completeVaccination(registrationNumber) {
    if (confirm(`Mark vaccination as complete for ${registrationNumber}?`)) {
        alert('Vaccination marked as complete');
        // Update the UI or refresh the schedule
    }
}

// Initialize user information
function initializeUserInfo() {
    // Get user info from localStorage or use default
    const currentUser = localStorage.getItem('currentUser') || 'Admin User';
    const loginTime = localStorage.getItem('loginTime') || new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    // Update user display
    document.getElementById('currentUser').textContent = currentUser;
    document.getElementById('loginTime').textContent = `Logged in: ${loginTime}`;
    
    // Set user initial (first letter of name)
    const userInitial = currentUser.charAt(0).toUpperCase();
    document.getElementById('userInitial').textContent = userInitial;
}

// Function to set user info (call this from login page)
function setUserInfo(username) {
    const loginTime = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    localStorage.setItem('currentUser', username);
    localStorage.setItem('loginTime', loginTime);
}

// Reschedule appointment
function rescheduleAppointment(registrationNumber) {
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    if (newDate) {
        alert(`Appointment rescheduled for ${newDate}`);
        // Update the schedule
    }
}

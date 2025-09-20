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
    
    // If switching to view-schedule, refresh the calendar data
    if (sectionName === 'view-schedule') {
        setTimeout(() => {
            fetchPatientsForCalendar().then(() => {
                updateCalendar();
            });
        }, 100);
    }
    
    // If switching to view-patient, initialize table functionality
    if (sectionName === 'view-patient') {
        initializeViewPatientSection();
    }
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

// Patient Details Modal Functions
async function viewPatientDetails(patientId) {
    try {
        const response = await fetch(`/patient/${patientId}`);
        if (response.ok) {
            const patient = await response.json();
            populateModal(patient);
            document.getElementById('patientModal').style.display = 'block';
        } else {
            alert('Error loading patient details');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading patient details');
    }
}

// Event delegation for action buttons
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-action')) {
            const button = e.target.closest('.btn-action');
            const patientId = button.getAttribute('data-patient-id');
            const action = button.getAttribute('data-action');
            
            if (action === 'view') {
                viewPatientDetails(patientId);
            } else if (action === 'edit') {
                editPatient(patientId);
            } else if (action === 'delete') {
                deletePatient(patientId);
            }
        }
    });
});

// Calendar functionality
let currentDate = new Date();
let selectedDate = null;
let patientsData = [];

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Fetch patients data for calendar
    fetchPatientsForCalendar();
    
    // Initialize calendar
    updateCalendar();
    
    // Set up event delegation for action buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-action')) {
            const button = e.target.closest('.btn-action');
            const patientId = button.getAttribute('data-patient-id');
            const action = button.getAttribute('data-action');
            
            if (action === 'view') {
                viewPatientDetails(patientId);
            } else if (action === 'edit') {
                editPatient(patientId);
            } else if (action === 'delete') {
                deletePatient(patientId);
            }
        }
    });
    
    // Set up search functionality
    const searchInput = document.getElementById('patient-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchPatients();
        });
    }
});

// Patient Search and Filter Functions
let allPatientsRows = []; // Store original patient rows

function initializePatientTable() {
    // Store original patient rows for filtering
    const table = document.querySelector('#view-patient .patient-table tbody');
    if (table) {
        allPatientsRows = Array.from(table.querySelectorAll('tr'));
        updateResultsCount(allPatientsRows.length);
    }
}

function searchPatients() {
    const searchTerm = document.getElementById('patient-search').value.toLowerCase().trim();
    const table = document.querySelector('#view-patient .patient-table tbody');
    
    if (!table || allPatientsRows.length === 0) {
        initializePatientTable();
        if (allPatientsRows.length === 0) return;
    }
    
    let visibleCount = 0;
    
    allPatientsRows.forEach(row => {
        const cells = row.cells;
        if (cells.length >= 4) {
            const id = cells[0].textContent.toLowerCase();
            const name = cells[1].textContent.toLowerCase();
            const date = cells[2].textContent.toLowerCase();
            const service = cells[3].textContent.toLowerCase();
            
            const isMatch = !searchTerm || 
                          id.includes(searchTerm) || 
                          name.includes(searchTerm) || 
                          date.includes(searchTerm) || 
                          service.includes(searchTerm);
            
            if (isMatch) {
                row.style.display = '';
                visibleCount++;
                
                // Highlight search terms
                if (searchTerm) {
                    highlightSearchTerm(cells[1], searchTerm); // Name
                    highlightSearchTerm(cells[3], searchTerm); // Service
                } else {
                    // Remove highlighting when search is cleared
                    removeHighlight(cells[1]);
                    removeHighlight(cells[3]);
                }
            } else {
                row.style.display = 'none';
            }
        }
    });
    
    updateResultsCount(visibleCount, searchTerm);
}

function highlightSearchTerm(cell, searchTerm) {
    const originalText = cell.getAttribute('data-original') || cell.textContent;
    cell.setAttribute('data-original', originalText);
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const highlightedText = originalText.replace(regex, '<span class="highlight">$1</span>');
    cell.innerHTML = highlightedText;
}

function removeHighlight(cell) {
    const originalText = cell.getAttribute('data-original');
    if (originalText) {
        cell.textContent = originalText;
        cell.removeAttribute('data-original');
    }
}

function clearSearch() {
    document.getElementById('patient-search').value = '';
    searchPatients();
}

function sortPatients() {
    const sortValue = document.getElementById('sort-select').value;
    const table = document.querySelector('#view-patient .patient-table tbody');
    
    if (!table || allPatientsRows.length === 0) {
        initializePatientTable();
        if (allPatientsRows.length === 0) return;
    }
    
    // Create a copy of visible rows only
    const visibleRows = allPatientsRows.filter(row => row.style.display !== 'none');
    
    visibleRows.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortValue) {
            case 'id':
                aValue = parseInt(a.cells[0].textContent) || 0;
                bValue = parseInt(b.cells[0].textContent) || 0;
                return aValue - bValue;
                
            case 'name':
                aValue = a.cells[1].textContent.toLowerCase();
                bValue = b.cells[1].textContent.toLowerCase();
                return aValue.localeCompare(bValue);
                
            case 'name-desc':
                aValue = a.cells[1].textContent.toLowerCase();
                bValue = b.cells[1].textContent.toLowerCase();
                return bValue.localeCompare(aValue);
                
            case 'date':
                aValue = new Date(a.cells[2].textContent || '1900-01-01');
                bValue = new Date(b.cells[2].textContent || '1900-01-01');
                return bValue - aValue; // Newest first
                
            case 'date-desc':
                aValue = new Date(a.cells[2].textContent || '1900-01-01');
                bValue = new Date(b.cells[2].textContent || '1900-01-01');
                return aValue - bValue; // Oldest first
                
            case 'service':
                aValue = a.cells[3].textContent.toLowerCase();
                bValue = b.cells[3].textContent.toLowerCase();
                return aValue.localeCompare(bValue);
                
            default:
                return 0;
        }
    });
    
    // Clear table and append sorted rows
    table.innerHTML = '';
    
    if (visibleRows.length === 0) {
        table.innerHTML = '<tr><td colspan="5">No patients found.</td></tr>';
    } else {
        visibleRows.forEach(row => table.appendChild(row));
    }
}

function updateResultsCount(count, searchTerm = '') {
    const resultsElement = document.getElementById('results-count');
    if (resultsElement) {
        if (searchTerm) {
            resultsElement.textContent = `Found ${count} patient${count !== 1 ? 's' : ''} for "${searchTerm}"`;
        } else {
            resultsElement.textContent = `Showing ${count} patient${count !== 1 ? 's' : ''}`;
        }
    }
}

// Initialize patient table when view-patient section is shown
function initializeViewPatientSection() {
    setTimeout(() => {
        initializePatientTable();
    }, 100);
}

async function fetchPatientsForCalendar() {
    try {
        const response = await fetch('/api/patients');
        if (response.ok) {
            const data = await response.json();
            patientsData = data.patients.map(patient => ({
                id: patient.id,
                name: patient.patient_name,
                dateBite: patient.date_of_bite,
                service: patient.service_type,
                day0: patient.day0,
                day3: patient.day3,
                day7: patient.day7,
                day14: patient.day14,
                day28: patient.day28
            }));
            
            console.log('Fetched patients data:', patientsData); // Debug log
            updateCalendar(); // Refresh calendar after fetching data
        } else {
            console.error('Failed to fetch patients data');
            // Fallback to parsing from HTML table if API fails
            parsePatientDataFromTable();
        }
    } catch (error) {
        console.error('Error fetching patients for calendar:', error);
        // Fallback to parsing from HTML table
        parsePatientDataFromTable();
    }
}

function parsePatientDataFromTable() {
    const patientRows = document.querySelectorAll('#view-patient tbody tr');
    patientsData = [];
    
    patientRows.forEach(row => {
        const cells = row.cells;
        if (cells.length >= 4 && cells[0].textContent.trim() !== 'No patients found.') {
            patientsData.push({
                id: cells[0].textContent.trim(),
                name: cells[1].textContent.trim(),
                dateBite: cells[2].textContent.trim(),
                service: cells[3].textContent.trim(),
                // For demo purposes, we'll calculate basic schedule from bite date
                day0: cells[2].textContent.trim(),
                day3: calculateScheduleDate(cells[2].textContent.trim(), 3),
                day7: calculateScheduleDate(cells[2].textContent.trim(), 7),
                day14: calculateScheduleDate(cells[2].textContent.trim(), 14),
                day28: calculateScheduleDate(cells[2].textContent.trim(), 28)
            });
        }
    });
    console.log('Parsed patients data from table:', patientsData); // Debug log
}

function calculateScheduleDate(biteDate, daysToAdd) {
    if (!biteDate || biteDate === 'Not scheduled' || biteDate === '') return null;
    
    try {
        const date = new Date(biteDate);
        if (isNaN(date.getTime())) return null;
        
        date.setDate(date.getDate() + daysToAdd);
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error calculating schedule date:', error);
        return null;
    }
}

// Add this function to initialize with better demo data
function initializeDemoScheduleData() {
    // If we have patients data but no proper schedule data, generate it
    patientsData.forEach(patient => {
        if (patient.dateBite && patient.dateBite !== 'Not scheduled') {
            if (!patient.day0) patient.day0 = patient.dateBite;
            if (!patient.day3) patient.day3 = calculateScheduleDate(patient.dateBite, 3);
            if (!patient.day7) patient.day7 = calculateScheduleDate(patient.dateBite, 7);
            if (!patient.day14) patient.day14 = calculateScheduleDate(patient.dateBite, 14);
            if (!patient.day28) patient.day28 = calculateScheduleDate(patient.dateBite, 28);
        }
    });
    console.log('Initialized demo schedule data:', patientsData);
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    updateCalendar();
}

function updateCalendar() {
    const monthYearElement = document.getElementById('calendar-month-year');
    const calendarDaysElement = document.getElementById('calendar-days');
    
    if (!monthYearElement || !calendarDaysElement) return;
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    
    monthYearElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Clear previous days
    calendarDaysElement.innerHTML = '';
    
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.onclick = () => selectDate(date);
        
        if (date.getMonth() !== currentDate.getMonth()) {
            dayElement.classList.add('other-month');
        }
        
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);
        
        // Add appointment dots for this date
        const dateString = date.toISOString().split('T')[0];
        const appointments = getAppointmentsForDate(dateString);
        
        appointments.forEach(appointment => {
            const dot = document.createElement('div');
            dot.className = `appointment-dot ${appointment.type}`;
            dot.title = `${appointment.patient} - ${appointment.type.toUpperCase()}`;
            dayElement.appendChild(dot);
        });
        
        calendarDaysElement.appendChild(dayElement);
    }
}

function selectDate(date) {
    selectedDate = date;
    
    // Update selected day styling
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    
    // Update daily schedule
    updateDailySchedule(date);
}

function updateDailySchedule(date) {
    const selectedDateElement = document.getElementById('selected-date');
    const appointmentListElement = document.getElementById('appointment-list');
    
    if (weekElement) weekElement.textContent = weekCount;
    if (monthElement) monthElement.textContent = monthCount;
    if (totalElement) totalElement.textContent = totalCount;
}

// Status management functions
function getAppointmentStatus(appointmentId) {
    const status = localStorage.getItem(`appointment_status_${appointmentId}`) || 'scheduled';
    console.log('Getting status for', appointmentId, ':', status);
    return status;
}

function setAppointmentStatus(appointmentId, status) {
    console.log('Setting status for', appointmentId, ':', status);
    localStorage.setItem(`appointment_status_${appointmentId}`, status);
}

function getAppointmentStatusClass(status) {
    switch(status) {
        case 'completed': return 'status-completed';
        case 'absent': return 'status-absent';
        case 'discarded': return 'status-discarded';
        default: return 'status-scheduled';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'completed': return 'Done';
        case 'absent': return 'No Show';
        case 'discarded': return 'Discarded';
        default: return 'Scheduled';
    }
}

// Action handlers
function addAppointmentActionHandlers() {
    console.log('Adding appointment action handlers...');
    
    // View appointment details
    const viewBtns = document.querySelectorAll('.btn-view-appointment');
    console.log('Found view buttons:', viewBtns.length);
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('View button clicked');
            try {
                const appointment = JSON.parse(this.dataset.appointment.replace(/&apos;/g, "'"));
                console.log('Showing appointment modal for:', appointment);
                showAppointmentModal(appointment);
            } catch (error) {
                console.error('Error parsing appointment data:', error);
            }
        });
    });
    
    // Mark as done
    const doneBtns = document.querySelectorAll('.btn-mark-done');
    console.log('Found done buttons:', doneBtns.length);
    doneBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Done button clicked');
            const appointmentId = this.dataset.appointmentId;
            console.log('Marking appointment as done:', appointmentId);
            setAppointmentStatus(appointmentId, 'completed');
            renderCalendar();
            updateCalendarStats();
            if (selectedDate) updateSelectedDateDetails(selectedDate);
        });
    });
    
    // Mark as absent
    const absentBtns = document.querySelectorAll('.btn-mark-absent');
    console.log('Found absent buttons:', absentBtns.length);
    absentBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Absent button clicked');
            const appointmentId = this.dataset.appointmentId;
            console.log('Marking appointment as absent:', appointmentId);
            setAppointmentStatus(appointmentId, 'absent');
            renderCalendar();
            updateCalendarStats();
            if (selectedDate) updateSelectedDateDetails(selectedDate);
        });
    });
    
    // Reschedule
    const rescheduleBtns = document.querySelectorAll('.btn-reschedule');
    console.log('Found reschedule buttons:', rescheduleBtns.length);
    rescheduleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Reschedule button clicked');
            try {
                const appointment = JSON.parse(this.dataset.appointment.replace(/&apos;/g, "'"));
                console.log('Showing reschedule modal for:', appointment);
                showRescheduleModal(appointment);
            } catch (error) {
                console.error('Error parsing appointment data for reschedule:', error);
            }
        });
    });
    
    // Discard
    const discardBtns = document.querySelectorAll('.btn-discard');
    console.log('Found discard buttons:', discardBtns.length);
    discardBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Discard button clicked');
            const appointmentId = this.dataset.appointmentId;
            console.log('Discarding appointment:', appointmentId);
            if (confirm('Are you sure you want to discard this appointment? This will make it inactive.')) {
                setAppointmentStatus(appointmentId, 'discarded');
                renderCalendar();
                updateCalendarStats();
                if (selectedDate) updateSelectedDateDetails(selectedDate);
            }
        });
    });
}

// Modal functions
function showAppointmentModal(appointment) {
    const modal = document.getElementById('appointmentModal');
    const content = document.getElementById('appointmentDetailsContent');
    
    content.innerHTML = `
        <div class="appointment-detail-container">
            <div class="detail-section">
                <h3>Patient Information</h3>
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${appointment.patient_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Service Type:</span>
                    <span class="detail-value">${appointment.service_type}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Schedule Type:</span>
                    <span class="detail-value">${appointment.scheduleType}</span>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Incident Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Bite Location:</span>
                    <span class="detail-value">${appointment.bite_location || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Place of Bite:</span>
                    <span class="detail-value">${appointment.place_of_bite || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Source of Bite:</span>
                    <span class="detail-value">${appointment.source_of_bite || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type of Bite:</span>
                    <span class="detail-value">${appointment.type_of_bite || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Source Status:</span>
                    <span class="detail-value">${appointment.source_status || 'N/A'}</span>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function showRescheduleModal(appointment) {
    const modal = document.getElementById('rescheduleModal');
    
    document.getElementById('reschedule_patient_name').value = appointment.patient_name;
    document.getElementById('reschedule_current_type').value = appointment.scheduleType;
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reschedule_new_date').min = today;
    
    modal.style.display = 'block';
    
    // Store appointment data for form submission
    modal.dataset.appointment = JSON.stringify(appointment);
}

function closeAppointmentModal() {
    document.getElementById('appointmentModal').style.display = 'none';
}

function closeRescheduleModal() {
    document.getElementById('rescheduleModal').style.display = 'none';
}

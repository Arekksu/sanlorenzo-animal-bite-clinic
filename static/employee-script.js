// Current active tab and section
let currentTab = 0;
let currentSection = 'dashboard';

// Modal functions
function viewPatientDetails(patientId) {
    const modal = document.getElementById('patientModal');
    const content = document.getElementById('patientDetailsContent');
    
    // Show loading
    content.innerHTML = '<div style="text-align: center; padding: 2rem;"><div class="loading">Loading patient details...</div></div>';
    modal.style.display = 'block';
    
    // Fetch patient details
    fetch(`/patient/${patientId}`)
        .then(response => response.json())
        .then(patient => {
            content.innerHTML = `
                <div class="patient-detail-container">
                    <div class="detail-section">
                        <h3>Personal Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Name:</span>
                            <span class="detail-value">${patient.patient_name || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Age:</span>
                            <span class="detail-value">${patient.age || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Gender:</span>
                            <span class="detail-value">${patient.gender || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Contact:</span>
                            <span class="detail-value">${patient.contact_number || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Address:</span>
                            <span class="detail-value">${patient.address || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Bite Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Date of Bite:</span>
                            <span class="detail-value">${patient.date_of_bite || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Bite Location:</span>
                            <span class="detail-value">${patient.bite_location || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Place of Bite:</span>
                            <span class="detail-value">${patient.place_of_bite || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Type of Bite:</span>
                            <span class="detail-value">${patient.type_of_bite || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Source of Bite:</span>
                            <span class="detail-value">${patient.source_of_bite || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Source Status:</span>
                            <span class="detail-value">${patient.source_status || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Exposure:</span>
                            <span class="detail-value">${patient.exposure || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Vaccinated:</span>
                            <span class="detail-value">${patient.vaccinated || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Treatment Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Service Type:</span>
                            <span class="detail-value">${patient.service_type || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Schedule</h3>
                        <div class="detail-row">
                            <span class="detail-label">Day 0:</span>
                            <span class="detail-value">${patient.day0 || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Day 3:</span>
                            <span class="detail-value">${patient.day3 || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Day 7:</span>
                            <span class="detail-value">${patient.day7 || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Day 14:</span>
                            <span class="detail-value">${patient.day14 || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Day 28:</span>
                            <span class="detail-value">${patient.day28 || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error fetching patient details:', error);
            content.innerHTML = '<div style="text-align: center; padding: 2rem; color: red;">Error loading patient details</div>';
        });
}

function editPatient(patientId) {
    const modal = document.getElementById('editPatientModal');
    const form = document.getElementById('editPatientForm');
    
    // Set form action
    form.action = `/edit-patient/${patientId}`;
    console.log('Setting form action to:', form.action);
    
    // Fetch patient details to populate form
    fetch(`/patient/${patientId}`)
        .then(response => response.json())
        .then(patient => {
            console.log('Patient data loaded:', patient);
            document.getElementById('edit_patient_name').value = patient.patient_name || '';
            document.getElementById('edit_age').value = patient.age || '';
            document.getElementById('edit_gender').value = patient.gender || '';
            document.getElementById('edit_contact_number').value = patient.contact_number || '';
            document.getElementById('edit_address').value = patient.address || '';
            document.getElementById('edit_service_type').value = patient.service_type || '';
            document.getElementById('edit_date_of_bite').value = patient.date_of_bite || '';
            document.getElementById('edit_bite_location').value = patient.bite_location || '';
            document.getElementById('edit_place_of_bite').value = patient.place_of_bite || '';
            document.getElementById('edit_type_of_bite').value = patient.type_of_bite || '';
            document.getElementById('edit_source_of_bite').value = patient.source_of_bite || '';
            document.getElementById('edit_source_status').value = patient.source_status || '';
            document.getElementById('edit_exposure').value = patient.exposure || '';
            
            // Handle radio buttons for vaccinated
            if (patient.vaccinated === 'Yes') {
                document.getElementById('edit_vaccinated_yes').checked = true;
            } else if (patient.vaccinated === 'No') {
                document.getElementById('edit_vaccinated_no').checked = true;
            }
            
            modal.style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching patient details:', error);
            alert('Error loading patient details for editing');
        });
}

function deletePatient(patientId) {
    if (confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
        fetch(`/delete-patient/${patientId}`, {
            method: 'POST',
        })
        .then(response => {
            if (response.ok) {
                alert('Patient deleted successfully');
                location.reload(); // Refresh the page to update the table
            } else {
                throw new Error('Failed to delete patient');
            }
        })
        .catch(error => {
            console.error('Error deleting patient:', error);
            alert('Error deleting patient');
        });
    }
}

function closeModal() {
    document.getElementById('patientModal').style.display = 'none';
}

function closeEditModal() {
    document.getElementById('editPatientModal').style.display = 'none';
}

// Close modals when clicking outside of them
window.onclick = function(event) {
    const patientModal = document.getElementById('patientModal');
    const editModal = document.getElementById('editPatientModal');
    
    if (event.target === patientModal) {
        closeModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for action buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-view')) {
            const patientId = e.target.closest('.btn-view').getAttribute('data-patient-id');
            viewPatientDetails(patientId);
        }
        
        if (e.target.closest('.btn-edit')) {
            const patientId = e.target.closest('.btn-edit').getAttribute('data-patient-id');
            editPatient(patientId);
        }
        
        if (e.target.closest('.btn-delete')) {
            const patientId = e.target.closest('.btn-delete').getAttribute('data-patient-id');
            deletePatient(patientId);
        }
        
        // Handle modal close buttons
        if (e.target.getAttribute('data-action') === 'close-modal') {
            closeModal();
        }
        
        if (e.target.getAttribute('data-action') === 'close-edit-modal') {
            closeEditModal();
        }
    });
    
    // Add form submission handler for edit patient form
    const editForm = document.getElementById('editPatientForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            console.log('Form submitting to:', this.action);
            console.log('Form method:', this.method);
            // Let the form submit normally - don't prevent default
        });
    }
});

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

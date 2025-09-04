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
    const appointmentModal = document.getElementById('appointmentModal');
    const rescheduleModal = document.getElementById('rescheduleModal');
    
    if (event.target === patientModal) {
        closeModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
    if (event.target === appointmentModal) {
        closeAppointmentModal();
    }
    if (event.target === rescheduleModal) {
        closeRescheduleModal();
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

// Calendar functionality
let currentDate = new Date();
let selectedDate = null;
let patientsData = [];

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for action buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-view')) {
            const patientId = e.target.closest('.btn-view').dataset.patientId;
            viewPatientDetails(patientId);
        } else if (e.target.closest('.btn-edit')) {
            const patientId = e.target.closest('.btn-edit').dataset.patientId;
            editPatient(patientId);
        } else if (e.target.closest('.btn-delete')) {
            const patientId = e.target.closest('.btn-delete').dataset.patientId;
            deletePatient(patientId);
        } else if (e.target.dataset.action === 'close-modal') {
            closeModal();
        } else if (e.target.dataset.action === 'close-edit-modal') {
            closeEditModal();
        } else if (e.target.dataset.action === 'close-appointment-modal') {
            closeAppointmentModal();
        } else if (e.target.dataset.action === 'close-reschedule-modal') {
            closeRescheduleModal();
        }
    });

    // Initialize calendar if schedule section exists
    if (document.getElementById('view-schedule')) {
        initializeCalendar();
        fetchPatientSchedules();
    }
    
    // Reschedule form submission
    const rescheduleForm = document.getElementById('rescheduleForm');
    if (rescheduleForm) {
        rescheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleReschedule();
        });
    }
});

// Handle reschedule form submission
function handleReschedule() {
    const modal = document.getElementById('rescheduleModal');
    const appointment = JSON.parse(modal.dataset.appointment);
    const newDate = document.getElementById('reschedule_new_date').value;
    const reason = document.getElementById('reschedule_reason').value;
    
    if (!newDate) {
        alert('Please select a new date');
        return;
    }
    
    // Here you would typically send this to your backend
    // For now, we'll just mark the old appointment as rescheduled and add a note
    const oldScheduleKey = `${appointment.patient_id}-${appointment.scheduleType.toLowerCase().replace(' ', '')}`;
    setAppointmentStatus(oldScheduleKey, 'rescheduled');
    
    // Store reschedule info
    localStorage.setItem(`reschedule_${oldScheduleKey}`, JSON.stringify({
        newDate: newDate,
        reason: reason,
        originalDate: selectedDate.toISOString().split('T')[0]
    }));
    
    alert(`Appointment rescheduled to ${new Date(newDate).toLocaleDateString()}${reason ? '\nReason: ' + reason : ''}`);
    
    closeRescheduleModal();
    renderCalendar();
    updateCalendarStats();
    if (selectedDate) updateSelectedDateDetails(selectedDate);
}

function initializeCalendar() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    
    if (prevBtn) prevBtn.addEventListener('click', () => navigateMonth(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigateMonth(1));
    
    renderCalendar();
}

function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
    updateCalendarStats();
}

function renderCalendar() {
    const monthElement = document.getElementById('currentMonth');
    const calendarGrid = document.querySelector('.calendar-grid');
    
    if (!monthElement || !calendarGrid) return;
    
    // Set month/year header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    monthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Clear existing calendar days (keep headers)
    const existingDays = calendarGrid.querySelectorAll('.calendar-day');
    existingDays.forEach(day => day.remove());
    
    // Get first day of month and number of days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    // Generate calendar days
    for (let i = 0; i < 42; i++) { // 6 weeks max
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        
        const dayElement = createDayElement(day);
        calendarGrid.appendChild(dayElement);
        
        if (day > lastDay && day.getDay() === 6) break; // Stop after last week
    }
}

function createDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = date.getDate();
    
    // Add classes based on date properties
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    const isPastDate = date < new Date().setHours(0,0,0,0);
    
    if (isToday) dayElement.classList.add('today');
    if (!isCurrentMonth) dayElement.classList.add('other-month');
    if (isPastDate) dayElement.classList.add('past-date');
    
    // Check for appointments on this date (excluding past completed/discarded)
    const appointmentCount = getActiveAppointmentsForDate(date);
    if (appointmentCount > 0) {
        dayElement.classList.add('has-appointments');
        const countElement = document.createElement('div');
        countElement.className = 'appointment-count';
        countElement.textContent = appointmentCount;
        dayElement.appendChild(countElement);
    }
    
    // Add click event
    dayElement.addEventListener('click', () => selectDate(date));
    
    return dayElement;
}

function getActiveAppointmentsForDate(date) {
    const dateString = date.toISOString().split('T')[0];
    const today = new Date();
    const isPastDate = date < new Date().setHours(0,0,0,0);
    
    return patientsData.filter(patient => {
        const appointments = [
            {date: patient.day0, type: 'day0'},
            {date: patient.day3, type: 'day3'},
            {date: patient.day7, type: 'day7'},
            {date: patient.day14, type: 'day14'},
            {date: patient.day28, type: 'day28'}
        ];
        
        return appointments.some(apt => {
            if (apt.date === dateString) {
                const scheduleKey = `${patient.id || patient.patient_id}-${apt.type}`;
                const status = getAppointmentStatus(scheduleKey);
                
                // Don't count discarded appointments
                if (status === 'discarded') return false;
                
                // Don't count past completed appointments
                if (isPastDate && status === 'completed') return false;
                
                return true;
            }
            return false;
        });
    }).length;
}

function selectDate(date) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    // Add selection to clicked day
    event.target.classList.add('selected');
    selectedDate = date;
    
    // Update selected date details
    updateSelectedDateDetails(date);
}

function getAppointmentsForDate(date) {
    const dateString = date.toISOString().split('T')[0];
    return patientsData.filter(patient => {
        return patient.day0 === dateString || 
               patient.day3 === dateString || 
               patient.day7 === dateString || 
               patient.day14 === dateString || 
               patient.day28 === dateString;
    }).length;
}

function updateSelectedDateDetails(date) {
    const detailsElement = document.getElementById('selectedDateInfo');
    if (!detailsElement) return;
    
    const dateString = date.toISOString().split('T')[0];
    const appointments = getAppointmentsForDateDetailed(date);
    
    if (appointments.length === 0) {
        detailsElement.innerHTML = `
            <p><strong>Date:</strong> ${date.toLocaleDateString()}</p>
            <p>No appointments scheduled for this date.</p>
        `;
        return;
    }
    
    let appointmentHTML = `
        <p><strong>Date:</strong> ${date.toLocaleDateString()}</p>
        <p><strong>Appointments (${appointments.length}):</strong></p>
        <ul class="appointment-list">
    `;
    
    appointments.forEach((appointment, index) => {
        const isPastDate = date < new Date().setHours(0,0,0,0);
        const statusClass = getAppointmentStatusClass(appointment.status || 'scheduled');
        const patientId = appointment.id || appointment.patient_id || index;
        const scheduleKey = appointment.scheduleType.toLowerCase().replace(' ', '');
        const appointmentId = `${patientId}-${scheduleKey}`;
        
        console.log('Creating appointment item:', {
            appointmentId,
            patientId,
            scheduleKey,
            appointment
        });
        
        appointmentHTML += `
            <li class="appointment-item ${statusClass}" data-appointment-id="${appointmentId}">
                <div class="appointment-info">
                    <h4>${appointment.patient_name}</h4>
                    <p><strong>Service:</strong> ${appointment.service_type}</p>
                    <p><strong>Schedule:</strong> ${appointment.scheduleType}</p>
                    <p><strong>Bite Location:</strong> ${appointment.bite_location || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${getStatusText(appointment.status || 'scheduled')}</span></p>
                </div>
                <div class="appointment-actions">
                    <button class="action-btn btn-view-appointment" 
                            data-appointment='${JSON.stringify(appointment).replace(/'/g, "&apos;")}'
                            title="View Details">
                        👁️
                    </button>
                    ${!isPastDate ? `
                        <button class="action-btn btn-mark-done" 
                                data-appointment-id="${appointmentId}"
                                title="Mark as Done">
                            ✅
                        </button>
                        <button class="action-btn btn-mark-absent" 
                                data-appointment-id="${appointmentId}"
                                title="Mark as No-Show">
                            ❌
                        </button>
                        <button class="action-btn btn-reschedule" 
                                data-appointment='${JSON.stringify(appointment).replace(/'/g, "&apos;")}'
                                title="Reschedule">
                            📅
                        </button>
                        <button class="action-btn btn-discard" 
                                data-appointment-id="${appointmentId}"
                                title="Discard/Deactivate">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </li>
        `;
    });
    
    appointmentHTML += '</ul>';
    detailsElement.innerHTML = appointmentHTML;
    
    // Add click handlers for action buttons
    addAppointmentActionHandlers();
    
    // Debug: Log the HTML that was just created
    console.log('Generated appointment HTML:', appointmentHTML);
    console.log('Selected date details element:', detailsElement);
}

function getAppointmentsForDateDetailed(date) {
    const dateString = date.toISOString().split('T')[0];
    const appointments = [];
    
    patientsData.forEach(patient => {
        const scheduleTypes = [
            {date: patient.day0, type: 'Day 0', key: 'day0'},
            {date: patient.day3, type: 'Day 3', key: 'day3'},
            {date: patient.day7, type: 'Day 7', key: 'day7'},
            {date: patient.day14, type: 'Day 14', key: 'day14'},
            {date: patient.day28, type: 'Day 28', key: 'day28'}
        ];
        
        scheduleTypes.forEach(schedule => {
            if (schedule.date === dateString) {
                const scheduleKey = `${patient.id || patient.patient_id}-${schedule.key}`;
                const status = getAppointmentStatus(scheduleKey);
                
                appointments.push({
                    ...patient, 
                    scheduleType: schedule.type,
                    status: status,
                    patient_id: patient.id || patient.patient_id
                });
            }
        });
    });
    
    return appointments;
}

function fetchPatientSchedules() {
    // For now, we'll use the patients data that's already available
    // In a real application, you might want to fetch this via AJAX
    // This is a placeholder - you can expand this to fetch via API
    fetch('/api/patient-schedules')
        .then(response => response.json())
        .then(data => {
            patientsData = data;
            renderCalendar();
            updateCalendarStats();
        })
        .catch(error => {
            console.log('Patient schedules API not available, using basic functionality');
            updateCalendarStats();
        });
}

function updateCalendarStats() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Count appointments for different periods (exclude past completed/discarded)
    let weekCount = 0;
    let monthCount = 0;
    let totalCount = 0;
    
    patientsData.forEach(patient => {
        [patient.day0, patient.day3, patient.day7, patient.day14, patient.day28].forEach((dateStr, index) => {
            if (dateStr) {
                const date = new Date(dateStr);
                const scheduleKey = `${patient.id || patient.patient_id}-${['day0', 'day3', 'day7', 'day14', 'day28'][index]}`;
                const status = getAppointmentStatus(scheduleKey);
                
                // Only count active appointments (not discarded or past completed)
                if (status !== 'discarded' && !(date < today && status === 'completed')) {
                    totalCount++;
                    
                    if (date >= startOfWeek && date <= endOfWeek) {
                        weekCount++;
                    }
                    if (date >= startOfMonth && date <= endOfMonth) {
                        monthCount++;
                    }
                }
            }
        });
    });
    
    // Update stat displays
    const weekElement = document.getElementById('weekPatients');
    const monthElement = document.getElementById('monthPatients');
    const totalElement = document.getElementById('totalScheduled');
    
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

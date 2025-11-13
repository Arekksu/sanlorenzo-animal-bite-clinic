// Vaccination radio button border color logic
document.addEventListener('DOMContentLoaded', function() {
  const radios = document.querySelectorAll('.vaccination-options input[type="radio"]');
  radios.forEach(radio => {
    radio.addEventListener('change', function() {
      radios.forEach(r => {
        if (r.checked) {
          r.nextElementSibling.classList.add('selected-radio');
        } else {
          r.nextElementSibling.classList.remove('selected-radio');
        }
      });
    });
    // Initial state
    if (radio.checked) {
      radio.nextElementSibling.classList.add('selected-radio');
    }
  });
});
/* ========= VIEW PATIENT: DATA + ACTIONS ========= */

// Utility
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s??''; return d.innerHTML; }

// Modal helpers with smooth animations
function openModal(id){
  const m=document.getElementById(id); 
  if(!m) return;
  
  // Set display first
  m.style.display='block';
  
  // Force reflow to ensure display change is applied
  m.offsetHeight;
  
  // Add show class for smooth animation
  setTimeout(() => {
    m.classList.add('show');
  }, 10);
  
  // Remove previous listeners to avoid stacking
  if (m._escListener) document.removeEventListener('keydown', m._escListener);
  if (m._bgListener) m.removeEventListener('click', m._bgListener);
  
  // ESC key
  m._escListener = function(ev){ 
    if(ev.key==='Escape'){ 
      closeModal(id); 
      document.removeEventListener('keydown',m._escListener); 
    } 
  };
  document.addEventListener('keydown', m._escListener);
  
  // Click outside modal
  m._bgListener = function(e){ 
    if(e.target===m){ 
      closeModal(id); 
      m.removeEventListener('click',m._bgListener); 
      document.removeEventListener('keydown',m._escListener); 
    } 
  };
  m.addEventListener('click', m._bgListener);
}

function closeModal(id){
  const m=document.getElementById(id);
  if(m) {
    // Remove show class for smooth close animation
    m.classList.remove('show');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      m.style.display='none';
    }, 300);
    
    if (m._escListener) document.removeEventListener('keydown', m._escListener);
    if (m._bgListener) m.removeEventListener('click', m._bgListener);
  }
}

// LOAD TABLE FROM API
async function reloadPatientTableFromAPI(){
  const tbody=document.querySelector('#view-patient .patient-table tbody');
  if(!tbody) return;
  try{
    const res=await fetch('/api/patients');
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload=await res.json();
    const patients=payload.patients || payload;

    tbody.innerHTML = patients.map(p=>`
      <tr>
        <td>${p.id}</td>
        <td>${escapeHtml(p.patient_name||'')}</td>
        <td>${p.date_of_bite || ''}</td>
        <td>${escapeHtml(p.service_type||'')}</td>
        <td class="actions-cell">
          <button class="btn-view"  data-patient-id="${p.id}" title="View">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"></path><circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="btn-edit" data-patient-id="${p.id}" title="Edit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7 21H3v-4L17 3z"></path>
            </svg>
          </button>
          <button class="btn-delete" data-patient-id="${p.id}" title="Delete">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      </tr>
    `).join('');

    wirePatientRowActions();
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5">Failed to load patients.</td></tr>`;
  }
}

// WIRE ACTION BUTTONS (View / Edit / Delete)
function wirePatientRowActions(){
  // VIEW
  document.querySelectorAll('.btn-view').forEach(b=>{
    b.onclick = async ()=>{
      const id=b.getAttribute('data-patient-id');
      try{
        const res=await fetch(`/patient/${id}`);
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        const p=await res.json();
        openPatientDetailsModal(p);
      }catch(err){
        console.error(err);
        alert('Error loading patient details.');
      }
    };
  });

  // EDIT
  document.querySelectorAll('.btn-edit').forEach(b=>{
    b.onclick = async ()=>{
      const id=b.getAttribute('data-patient-id');
      try{
        const res=await fetch(`/patient/${id}`);
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        const p=await res.json();
        openEditPatientModal(p);
      }catch(err){
        console.error(err);
        alert('Error loading patient for edit.');
      }
    };
  });

  // DELETE (with modal confirm)
  document.querySelectorAll('.btn-delete').forEach(b=>{
    b.onclick = ()=>{
      const id=b.getAttribute('data-patient-id');
      showDeleteModal(id);
    };
  });
}

// DELETE MODAL FUNCTIONS
let pendingDeletePatientId = null;

function showDeleteModal(patientId) {
  pendingDeletePatientId = patientId;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) {
    modal.style.display = 'block';
    
    // Force reflow to trigger animation
    modal.offsetHeight;
    
    // Add show class for animation
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // Add click outside to close
    setTimeout(() => {
      modal.onclick = function(event) {
        if (event.target === modal) {
          closeDeleteModal();
        }
      };
    }, 100);
    
    // Add ESC key to close
    document.addEventListener('keydown', handleDeleteModalEscape);
  }
}

function handleDeleteModalEscape(event) {
  if (event.key === 'Escape') {
    closeDeleteModal();
  }
}

function closeDeleteModal() {
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) {
    // Remove show class for fade out animation
    modal.classList.remove('show');
    
    // Wait for animation to finish before hiding
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
    
    modal.onclick = null;
  }
  document.removeEventListener('keydown', handleDeleteModalEscape);
  pendingDeletePatientId = null;
}

async function confirmDeletePatient() {
  if (!pendingDeletePatientId) return;
  
  const id = pendingDeletePatientId;
  closeDeleteModal();
  
  try{
    const res=await fetch(`/delete-patient/${id}`,{method:'DELETE'});
    if(!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }
    showToast('Patient deleted successfully!', 'success');
    await reloadPatientTableFromAPI();
    
    // Update dashboard stats after deletion
    if (typeof updateAllDashboardStats === 'function') {
      updateAllDashboardStats();
    }
  }catch(err){
    console.error(err);
    showToast('Failed to delete patient: ' + err.message, 'error');
  }
}

// VIEW MODAL CONTENT (all relevant details)
function openPatientDetailsModal(p){
  const body=document.getElementById('patientModalBody');
  if(!body){ alert(p.patient_name||'Patient'); return; }

  const show = v => (v===null || v===undefined || v==='') ? '—' : escapeHtml(String(v));
  body.innerHTML = `
    <div class="patient-details-grid">
      <div class="detail-section">
        <h3>Patient</h3>
        <div class="detail-row"><label>Name:</label><span>${show(p.patient_name)}</span></div>
        <div class="detail-row"><label>Age:</label><span>${show(p.age)}</span></div>
        <div class="detail-row"><label>Gender:</label><span>${show(p.gender)}</span></div>
        <div class="detail-row"><label>Contact:</label><span>${show(p.contact_number)}</span></div>
        <div class="detail-row"><label>Weight:</label><span>${show(p.weight)}</span></div>
        <div class="detail-row"><label>Medical History:</label><span>${show(p.medical_history)}</span></div>
        <div class="detail-row"><label>Medication (NA if Not Applicable):</label><span>${show(p.medication)}</span></div>
      
        <div class="detail-row"><label>Address:</label><span>${show(p.address)}</span></div>
      </div>
      <div class="detail-section">
        <h3>Incident & Service</h3>
        <div class="detail-row"><label>Service:</label><span>${show(p.service_type)}</span></div>
        <div class="detail-row"><label>Route of Vaccine:</label><span>${show(p.route_of_vaccine)}</span></div>
        <div class="detail-row"><label>Booster 1</label><span>${show(p.booster1)}</span></div>
        <div class="detail-row"><label>Booster 2</label><span>${show(p.booster2)}</span></div>
        <div class="detail-row"><label>Date of Bite:</label><span>${show(p.date_of_bite)}</span></div>
        <div class="detail-row"><label>Bite Location:</label><span>${show(p.bite_location)}</span></div>
        <div class="detail-row"><label>Place of Bite:</label><span>${show(p.place_of_bite)}</span></div>
        <div class="detail-row"><label>Source of Bite:</label><span>${show(p.source_of_bite)}</span></div>
        <div class="detail-row"><label>Type of Bite:</label><span>${show(p.type_of_bite)}</span></div>
        <div class="detail-row"><label>Bite Category:</label><span>${show(p.bite_category)}</span></div>
        <div class="detail-row"><label>Source Status:</label><span>${show(p.source_status)}</span></div>
        <div class="detail-row"><label>Exposure:</label><span>${show(p.exposure)}</span></div>
        <div class="detail-row"><label>Type of Exposure</label><span>${show(p.type_of_exposure)}</span></div>
        

        <div class="detail-row"><label>Additional Remarks: </label><span>${show(p.additional_remarks)}</span></div>
        <div class="detail-row"><label>TT1</label><span>${show(p.tt1)}</span></div>
        <div class="detail-row"><label>TT6</label><span>${show(p.tt6)}</span></div>
        <div class="detail-row"><label>TT30</label><span>${show(p.tt30)}</span></div>
        <div class="detail-row"><label>Anti-tetanus Toxoid Dosage</label><span>${show(p.anti_tetanus)}</span></div>
        
        <div class="detail-row"><label>Patient Refusal of Erig Administration</label><span>${show(p.erig_refusal)}</span></div>
        <div class="detail-row"><label>Vaccincation Route for IM</label><span>${show(p.route_im_consent)}</span></div>
         <div class="detail-row"><label>Treatment and Vaccination</label><span>${show(p.consent)}</span></div>
        
      </div>
      <div class="detail-section">
        <h3>Schedule</h3>
        <div class="detail-row"><label>Day 0:</label><span>${show(p.day0)}</span></div>
        <div class="detail-row"><label>Day 3:</label><span>${show(p.day3)}</span></div>
        <div class="detail-row"><label>Day 7:</label><span>${show(p.day7)}</span></div>
        <div class="detail-row"><label>Day 14:</label><span>${show(p.day14)}</span></div>
        <div class="detail-row"><label>Day 28:</label><span>${show(p.day28)}</span></div>
      </div>
    </div>
  `;
  openModal('patientModal');
}

// EDIT MODAL (prefill)
function openEditPatientModal(p){
  const val = (x)=> x??'';
  document.getElementById('edit_patient_id').value = p.id;
  document.getElementById('edit_patient_name').value = val(p.patient_name);
  document.getElementById('edit_date_of_bite').value = val((p.date_of_bite||'').slice(0,10));
  document.getElementById('edit_service_type').value = val(p.service_type);
  document.getElementById('edit_contact_number').value = val(p.contact_number);
  document.getElementById('edit_age').value = val(p.age);
  document.getElementById('edit_gender').value = val(p.gender);
  document.getElementById('edit_address').value = val(p.address);

  document.getElementById('edit_bite_location').value = val(p.bite_location);
  document.getElementById('edit_place_of_bite').value = val(p.place_of_bite);
  document.getElementById('edit_source_of_bite').value = val(p.source_of_bite);
  document.getElementById('edit_type_of_bite').value = val(p.type_of_bite);
  document.getElementById('edit_source_status').value = val(p.source_status);
  document.getElementById('edit_exposure').value = val(p.exposure);

  document.getElementById('edit_day0').value  = val((p.day0 || '').slice(0,10));
  document.getElementById('edit_day3').value  = val((p.day3 || '').slice(0,10));
  document.getElementById('edit_day7').value  = val((p.day7 || '').slice(0,10));
  document.getElementById('edit_day14').value = val((p.day14|| '').slice(0,10));
  document.getElementById('edit_day28').value = val((p.day28|| '').slice(0,10));

  openModal('editPatientModal');
}

// SAVE EDIT (requires server endpoint)
async function submitEditPatient(e){
  e.preventDefault();
  const id = document.getElementById('edit_patient_id').value;

  const payload = {
    patient_name: document.getElementById('edit_patient_name').value.trim(),
    date_of_bite: document.getElementById('edit_date_of_bite').value || null,
    service_type: document.getElementById('edit_service_type').value.trim() || null,
    contact_number: document.getElementById('edit_contact_number').value.trim() || null,
    age: Number(document.getElementById('edit_age').value || 0) || null,
    gender: document.getElementById('edit_gender').value || null,
    address: document.getElementById('edit_address').value.trim() || null,
    bite_location: document.getElementById('edit_bite_location').value.trim() || null,
    place_of_bite: document.getElementById('edit_place_of_bite').value.trim() || null,
    source_of_bite: document.getElementById('edit_source_of_bite').value.trim() || null,
    type_of_bite: document.getElementById('edit_type_of_bite').value.trim() || null,
    source_status: document.getElementById('edit_source_status').value.trim() || null,
    exposure: document.getElementById('edit_exposure').value.trim() || null,
    day0:  document.getElementById('edit_day0').value  || null,
    day3:  document.getElementById('edit_day3').value  || null,
    day7:  document.getElementById('edit_day7').value  || null,
    day14: document.getElementById('edit_day14').value || null,
    day28: document.getElementById('edit_day28').value || null
  };

  try{
    // Palitan mo kung iba ang route/method sa Flask app mo:
    const res = await fetch(`/update-patient/${id}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    closeModal('editPatientModal');
    await reloadPatientTableFromAPI();
    alert('Patient updated successfully.');
  }catch(err){
    console.warn('Update endpoint missing or failed:', err);
    alert('Update endpoint not available. Please implement /update-patient/<id>.');
  }
  return false;
}

// auto-load pag bukas ng page o switching sa View Patient
document.addEventListener('DOMContentLoaded', reloadPatientTableFromAPI);
window.reloadPatientTableFromAPI = reloadPatientTableFromAPI; // optional expose
window.closeModal = closeModal;
window.submitEditPatient = submitEditPatient;
/* === EMPLOYEE DASHBOARD SCRIPT (clean patch, real DB data) === */

/* Prevent horizontal scroll bleed */
document.body.style.overflowX = 'hidden';

/* State */
let currentTab = 0;
let currentSection = 'dashboard';
let currentDate = new Date();
let selectedDate = null;
let patientsData = [];       // for calendar
let allPatientsRows = [];    // for table filtering/sorting

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  updateCurrentDate();
  setupEmployeeSearchBar();        // header search (optional)
  initializeUserInfo();

  // I-init ang table cache mula sa DOM na nirender ng server
  initializeViewPatientSection();

  // Calendar data (real DB)
  await fetchPatientsForCalendar();
  updateCalendar();

  // Fix: Ensure required fields are focusable on submit
  const addRecordForm = document.querySelector('#add-record form');
  if (addRecordForm) {
    addRecordForm.addEventListener('submit', function(e) {
      // Always show Personal Info tab before submit
      showTab('personal-info');
      setTimeout(() => {
        // If invalid, scroll to first invalid field
        const firstInvalid = addRecordForm.querySelector(':invalid');
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.scrollIntoView({behavior:'smooth',block:'center'});
        }
      }, 10);
    });
  }
});

/* ---------- HEADER DATE / USER ---------- */
function updateCurrentDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function setupEmployeeSearchBar() {
  const input = document.getElementById('employeeHeaderSearch');
  if (!input) return;
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performEmployeeSearch();
  });
}
function performEmployeeSearch() {
  const box = document.getElementById('employeeHeaderSearch');
  const q = (box?.value || '').trim().toLowerCase();
  if (!q) { alert('Please enter a search term'); return; }

  showSection('view-patient');
  // Gamitin ang table filter sa ibaba
  const searchInput = document.getElementById('patient-search');
  if (searchInput) {
    searchInput.value = q;
    searchPatients();
  }
  box.value = '';
}

function initializeUserInfo() {
  const name = localStorage.getItem('currentUser') || 'Admin User';
  const loginTime = localStorage.getItem('loginTime') || new Date().toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit', hour12:true});
  const elUser = document.getElementById('currentUser');
  const elLogin = document.getElementById('loginTime');
  const elInit = document.getElementById('userInitial');
  if (elUser) elUser.textContent = name;
  if (elLogin) elLogin.textContent = `Logged in: ${loginTime}`;
  if (elInit) elInit.textContent = name.charAt(0).toUpperCase();
}

/* ---------- SECTION NAV ---------- */
// Load and display employee list
async function loadEmployeeList() {
    const tbody = document.getElementById('employee-list-body');
    if (!tbody) return;

    try {
        const response = await fetch('/get_employees');
        const data = await response.json();

        if (data.success) {
            tbody.innerHTML = data.employees.map(emp => `
                <tr>
                    <td>${emp.employee_id}</td>
                    <td>${escapeHtml(emp.username)}</td>
                    <td>${escapeHtml(emp.name)}</td>
                    <td>${escapeHtml(emp.role)}</td>
                    <td>${formatLastLogin(emp.last_login)}</td>
                    <td>
                        <span class="status-badge ${emp.active ? 'active' : 'inactive'}">
                            ${emp.active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="actions-cell">
                        <button onclick="viewEmployeeDetails(${emp.employee_id})" class="btn-icon" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${emp.username !== 'admin' ? `
                            <button onclick="toggleEmployeeStatus(${emp.employee_id}, ${!emp.active})" class="btn-icon" title="${emp.active ? 'Deactivate' : 'Activate'}">
                                <i class="fas fa-${emp.active ? 'user-slash' : 'user-check'}"></i>
                            </button>
                            <button onclick="resetEmployeePassword(${emp.employee_id})" class="btn-icon" title="Reset Password">
                                <i class="fas fa-key"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Failed to load employee list.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading employee list.</td></tr>';
    }
}

// Helper to format last login
function formatLastLogin(val) {
    if (!val) return 'Never';
    const d = new Date(val);
    if (isNaN(d)) {
        // Fallback: show raw string if parsing fails
        return String(val);
    }
    return d.toLocaleString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
        timeZone: 'Asia/Manila'
    });
}

/* ---------- SECTION NAV ---------- */
// Load and display employee list
async function loadEmployeeList() {
    const tbody = document.getElementById('employee-list-body');
    if (!tbody) return;

    try {
        const response = await fetch('/get_employees');
        const data = await response.json();

        if (data.success) {
            tbody.innerHTML = data.employees.map(emp => `
                <tr>
                    <td>${emp.employee_id}</td>
                    <td>${escapeHtml(emp.username)}</td>
                    <td>${escapeHtml(emp.name)}</td>
                    <td>${escapeHtml(emp.role)}</td>
                    <td>${formatLastLogin(emp.last_login)}</td>
                    <td>
                        <span class="status-badge ${emp.active ? 'active' : 'inactive'}">
                            ${emp.active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="actions-cell">
                        <button onclick="viewEmployeeDetails(${emp.employee_id})" class="btn-icon" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${emp.username !== 'admin' ? `
                            <button onclick="toggleEmployeeStatus(${emp.employee_id}, ${!emp.active})" class="btn-icon" title="${emp.active ? 'Deactivate' : 'Activate'}">
                                <i class="fas fa-${emp.active ? 'user-slash' : 'user-check'}"></i>
                            </button>
                            <button onclick="resetEmployeePassword(${emp.employee_id})" class="btn-icon" title="Reset Password">
                                <i class="fas fa-key"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Failed to load employee list.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading employee list.</td></tr>';
    }
}

// Refresh employee list
function refreshEmployeeList() {
    loadEmployeeList();
    showToast('Employee list refreshed', 'success');
}

// Handle employee search
function handleEmployeeSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('#employee-list-body tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// View employee details
async function viewEmployeeDetails(employeeId) {
    try {
        const response = await fetch(`/get_employee/${employeeId}`);
        const data = await response.json();
        
        if (!data.success) {
            showNotification('Failed to load employee details: ' + data.message, 'error');
            return;
        }

        const emp = data.employee;
        const modalContent = `
             <div class="employee-details">
                <h3>Employee Information</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Employee ID:</label>
                        <span>${emp.employee_id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Username:</label>
                        <span>${escapeHtml(emp.username)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Display Name:</label>
                        <span>${escapeHtml(emp.name)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Role:</label>
                        <span>${emp.username === 'admin' ? 'Admin' : 'Employee'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${emp.active ? 'active' : 'inactive'}">
                            ${emp.active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div class="detail-item">
                        <label>Last Login:</label>
                        <span>${emp.last_login ? formatLastLogin(emp.last_login) : 'Never'}</span>
                    </div>
                </div>
            </div>
        `;

        showModal('Employee Details', modalContent);
    } catch (error) {
        console.error('Error viewing employee details:', error);
        showNotification('Error loading employee details: ' + error.message, 'error');
    }
}

// Toggle employee status (activate/deactivate)
async function toggleEmployeeStatus(employeeId, newStatus) {
    const action = newStatus ? 'activate' : 'deactivate';
    const confirmMsg = `Are you sure you want to ${action} this employee account?`;
    
    showConfirmModal(
        `${action.charAt(0).toUpperCase() + action.slice(1)} Employee`,
        confirmMsg,
        async () => {
            try {
                const response = await fetch(`/toggle_employee_status/${employeeId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ active: newStatus })
                });

                const data = await response.json();
                if (!data.success) {
                    showNotification(data.message || 'Failed to update employee status', 'error');
                    return;
                }

                showNotification(`Employee ${action}d successfully!`, 'success');
                loadEmployeeList();
            } catch (error) {
                console.error('Error toggling employee status:', error);
                showNotification('Error updating employee status: ' + error.message, 'error');
            }
        }
    );
}

// Reset employee password
async function resetEmployeePassword(employeeId) {
    const modalContent = `
        <div class="reset-password-info">
            <p style="margin-bottom: 15px;">This will reset the employee's password to the default password.</p>
            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                <strong style="color: #856404;">Default Password:</strong>
                <div style="font-family: monospace; font-size: 18px; margin-top: 8px; color: #856404;">
                    <strong>password123</strong>
                </div>
            </div>
            <p style="margin-top: 15px; color: #666; font-size: 14px;">
                <em>Note: The employee should change this password after logging in.</em>
            </p>
        </div>
    `;
    
    showConfirmModal(
        'Reset Password',
        modalContent,
        async () => {
            try {
                const response = await fetch(`/reset_password/${employeeId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                if (!data.success) {
                    showNotification(data.message || 'Failed to reset password', 'error');
                    return;
                }

                showNotification('Password reset successfully to: password123', 'success');
            } catch (error) {
                console.error('Error resetting password:', error);
                showNotification('Error resetting password: ' + error.message, 'error');
            }
        },
        'Reset Password',
        'Cancel'
    );
}

// Initialize employee list features
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('employee-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleEmployeeSearch);
    }

    // Load employee list when switching to the view
    const viewEmployeesBtn = document.querySelector('button[onclick="showSection(\'view-employees\')"]');
    if (viewEmployeesBtn) {
        viewEmployeesBtn.addEventListener('click', loadEmployeeList);
    }
});

// Clear form and prevent autofill
function clearEmployeeForm() {
  const form = document.getElementById('add-employee-form');
  if (form) {
    form.reset();
    // Clear all inputs explicitly
    form.querySelectorAll('input').forEach(input => {
      input.value = '';
    });
    // Reset select to default
    const roleSelect = document.getElementById('new-employee-role');
    if (roleSelect) roleSelect.selectedIndex = 0;
  }
}

function handleAddEmployee(event) {
  event.preventDefault();
  
  // Get form values (trim to remove any whitespace)
  const username = document.getElementById('new-employee-username').value.trim();
  const displayName = document.getElementById('new-employee-name').value.trim();
  const password = document.getElementById('new-employee-password').value;
  const confirmPassword = document.getElementById('new-employee-confirm-password').value;
  const role = document.getElementById('new-employee-role').value;

  // Basic validation
  if (password !== confirmPassword) {
    showToast('Passwords do not match!', 'error');
    return false;
  }

  // Create form data
  const formData = new FormData();
  formData.append('username', username);
  formData.append('display_name', displayName);
  formData.append('password', password);
  formData.append('role', role);

  // Send request to server
  fetch('/create_employee', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showToast('Employee account created successfully!', 'success');
      clearEmployeeForm(); // Use our new clear function
    } else {
      showToast(data.message || 'Failed to create account', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showToast('An error occurred while creating the account', 'error');
  });

  return false;
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

function showSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(sectionName);
  if (sec) sec.classList.add('active');

  document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.menu-btn')).find(b => {
    const t = b.textContent.trim();
    return (sectionName === 'dashboard' && t === 'Dashboard') ||
           (sectionName === 'add-record' && t === 'Add Record') ||
           (sectionName === 'view-patient' && t === 'View Patient') ||
           (sectionName === 'view-schedule' && t === 'View Schedule');
  });
  if (btn) btn.classList.add('active');

  currentSection = sectionName;

  if (sectionName === 'dashboard') {
    // Initialize charts when dashboard is shown
    setTimeout(() => {
      if (typeof Chart !== 'undefined') {
        console.log('Dashboard section activated, initializing charts...');
        initializeAnalyticsCharts();
      }
    }, 100);
  }
  if (sectionName === 'view-patient') {
    // Pull fresh data from DB then (re)initialize filters/sorts
    reloadPatientTableFromAPI().then(() => initializeViewPatientSection());
  }
  if (sectionName === 'view-schedule') {
    fetchPatientsForCalendar().then(updateCalendar);
  }
}

/* ---------- ADD RECORD TABS ---------- */
function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById(tabName);
  if (tab) tab.classList.add('active');

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const active = Array.from(document.querySelectorAll('.tab-btn')).find(b => {
    const text = b.textContent.toLowerCase();
    return (tabName === 'personal-info' && text.includes('personal')) ||
           (tabName === 'vaccine-bite-info' && text.includes('vaccine')) ||
           (tabName === 'schedule' && text.includes('schedule'));
  });
  if (active) active.classList.add('active');

  const tabs = ['personal-info','vaccine-bite-info','schedule'];
  currentTab = tabs.indexOf(tabName);
}
function nextTab(){ const t=['personal-info','vaccine-bite-info','schedule']; if(currentTab<t.length-1){currentTab++; showTab(t[currentTab]);}}
function previousTab(){ const t=['personal-info','vaccine-bite-info','schedule']; if(currentTab>0){currentTab--; showTab(t[currentTab]);}}

/* ---------- SAVE RECORD (placeholder; server form ang gamit mo) ---------- */
function saveRecord(){ alert('Use the server form to submit.'); }

/* ---------- LOGOUT ---------- */
function logout(){
  if (confirm('Are you sure you want to logout?')) window.location.href = 'employee-login.html';
}

/* ====================================================================== */
/*                            VIEW PATIENT TABLE                          */
/* ====================================================================== */

/* 1) I-cache ang initial rows na nirender ng server para gumana ang search/sort */
function initializeViewPatientSection() {
  const tbody = document.querySelector('#view-patient .patient-table tbody');
  if (!tbody) return;
  allPatientsRows = Array.from(tbody.querySelectorAll('tr')).filter(
    r => r.querySelectorAll('td').length > 0 && r.textContent.trim() !== 'No patients found.'
  );
  updateResultsCount(allPatientsRows.length);
}

/* 2) Real data fetch from /api/patients (hindi na gagamit ng patientDatabase) */
async function reloadPatientTableFromAPI() {
  const tbody = document.querySelector('#view-patient .patient-table tbody');
  if (!tbody) return;
  try {
    const res = await fetch('/api/patients');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const patients = data.patients || [];

    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No patients found.</td></tr>`;
      allPatientsRows = [];
      updateResultsCount(0);
      return;
    }

    tbody.innerHTML = patients.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${escapeHtml(p.patient_name)}</td>
        <td>${p.date_of_bite || ''}</td>
        <td>${escapeHtml(p.service_type || '')}</td>
        <td class="actions-cell">
          <button class="btn-view" data-patient-id="${p.id}" title="View">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"></path><circle cx="12" cy="12" r="3"></circle>
          </button>
          <button class="btn-edit" data-patient-id="${p.id}" title="Edit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7 21H3v-4L17 3z"></path>
            </svg>
          </button>
          <button class="btn-delete" data-patient-id="${p.id}" title="Delete">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      </tr>
    `).join('');

    // refresh cache for search/sort
    allPatientsRows = Array.from(tbody.querySelectorAll('tr'));
    updateResultsCount(allPatientsRows.length);

    // wire actions
    wirePatientRowActions();

  } catch (err) {
    console.error('reloadPatientTableFromAPI failed:', err);
  }
}

/* 3) Search/Filter */
function searchPatients() {
  const q = (document.getElementById('patient-search')?.value || '').toLowerCase().trim();
  const tbody = document.querySelector('#view-patient .patient-table tbody');
  if (!tbody || allPatientsRows.length === 0) return;

  let count = 0;
  allPatientsRows.forEach(row => {
    const cells = row.cells;
    if (cells.length >= 4) {
      const id = cells[0].textContent.toLowerCase();
      const name = cells[1].textContent.toLowerCase();
      const date = cells[2].textContent.toLowerCase();
      const service = cells[3].textContent.toLowerCase();

      const match = !q || id.includes(q) || name.includes(q) || date.includes(q) || service.includes(q);
      row.style.display = match ? '' : 'none';
      count += match ? 1 : 0;

      // highlight name/service kapag may query
      removeHighlight(cells[1]); removeHighlight(cells[3]);
      if (q && match) {
        highlightSearchTerm(cells[1], q);
        highlightSearchTerm(cells[3], q);
      }
    }
  });
  updateResultsCount(count, q);
}
function clearSearch(){ const i=document.getElementById('patient-search'); if(i){i.value='';} searchPatients(); }

function highlightSearchTerm(cell, term){
  const original = cell.getAttribute('data-original') || cell.textContent;
  cell.setAttribute('data-original', original);
  const regex = new RegExp(`(${term})`,'gi');
  cell.innerHTML = original.replace(regex, '<span class="highlight">$1</span>');
}
function removeHighlight(cell){
  const original = cell.getAttribute('data-original');
  if (original){ cell.textContent = original; cell.removeAttribute('data-original'); }
}
function updateResultsCount(count, term=''){
  const el = document.getElementById('results-count');
  if (!el) return;
  el.textContent = term ? `Found ${count} result${count!==1?'s':''} for "${term}"`
                        : `Showing ${count} patient${count!==1?'s':''}`;
}

/* 4) Row Actions (view/edit/delete) */
function wirePatientRowActions() {
  document.querySelectorAll('.btn-view').forEach(b => {
    b.onclick = async () => {
      const id = b.getAttribute('data-patient-id');
      try {
        const res = await fetch(`/patient/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = await res.json();
        openPatientDetailsModal(p);
      } catch (err) {
        console.error(err);
        alert('Error loading patient details.');
      }
    };
  });

  document.querySelectorAll('.btn-edit').forEach(b => {
    b.onclick = async () => {
      const id = b.getAttribute('data-patient-id');
      try {
        const res = await fetch(`/patient/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = await res.json();
        openEditPatientModal(p);
      } catch (err) {
        console.error(err);
        alert('Error loading patient for edit.');
      }
    };
  });

  document.querySelectorAll('.btn-delete').forEach(b => {
    b.onclick = () => {
      const id = b.getAttribute('data-patient-id');
      showDeleteModal(id);
    };
  });
}

/* View details (modal-ready; guarded kung walang modal HTML) */
async function viewPatientDetails(patientId){
  try{
    const res = await fetch(`/patient/${patientId}`);
    if (!res.ok) throw new Error('Not found');
    const patient = await res.json();

    // If you have a modal, populate it:
    const modal = document.getElementById('patientModal');
    const body  = document.getElementById('patientModalBody');
    if (modal && body) {
      body.innerHTML = `
        <div class="patient-details-grid">
          <div class="detail-section">
            <h3>Patient</h3>
            <div class="detail-row"><label>Name:</label><span>${escapeHtml(patient.patient_name||'')}</span></div>
            <div class="detail-row"><label>Gender:</label><span>${escapeHtml(patient.gender||'')}</span></div>
            <div class="detail-row"><label>Age:</label><span>${escapeHtml(String(patient.age||''))}</span></div>
            <div class="detail-row"><label>Contact:</label><span>${escapeHtml(patient.contact_number||'')}</span></div>
          </div>
          <div class="detail-section">
            <h3>Incident</h3>
            <div class="detail-row"><label>Date of bite:</label><span>${patient.date_of_bite||''}</span></div>
            <div class="detail-row"><label>Service:</label><span>${escapeHtml(patient.service_type||'')}</span></div>
            <div class="detail-row"><label>Bite location:</label><span>${escapeHtml(patient.bite_location||'')}</span></div>
            <div class="detail-row"><label>Source of bite:</label><span>${escapeHtml(patient.source_of_bite||'')}</span></div>
          </div>
        </div>`;
      modal.style.display = 'block';
    } else {
      // fallback
      alert(`Patient: ${patient.patient_name}\nService: ${patient.service_type}\nBite: ${patient.date_of_bite}`);
    }
  }catch(err){
    console.error(err); alert('Error loading patient details.');
  }
}

/* ====================================================================== */
/*                                 CALENDAR                               */
/* ====================================================================== */

async function fetchPatientsForCalendar() {
  try{
    const res = await fetch('/api/patients');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    patientsData = (data.patients||[]).map(p => ({
      id: p.id,
      name: p.patient_name,
      service: p.service_type,
      dateBite: p.date_of_bite,
      day0: p.day0,
      day3: p.day3,
      day7: p.day7,
      day14: p.day14,
      day28: p.day28
    }));
  }catch(err){
    console.error('fetchPatientsForCalendar failed:', err);
    patientsData = [];
  }
}

function changeMonth(dir){ currentDate.setMonth(currentDate.getMonth()+dir); updateCalendar(); }

function updateCalendar() {
  const monthYearEl = document.getElementById('calendar-month-year');
  const daysEl = document.getElementById('calendar-days');
  if (!monthYearEl || !daysEl) return;

  const mNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  monthYearEl.textContent = `${mNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  daysEl.innerHTML = '';
  const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const start = new Date(first); start.setDate(start.getDate() - first.getDay());
  const today = new Date();

  for (let i=0; i<42; i++) {
    const d = new Date(start); d.setDate(start.getDate()+i);
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    if (d.getMonth() !== currentDate.getMonth()) cell.classList.add('other-month');
    if (d.toDateString() === today.toDateString()) cell.classList.add('today');

    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = d.getDate();
    cell.appendChild(num);

    const iso = d.toISOString().split('T')[0];
    const appts = getAppointmentsForDate(iso);
    appts.forEach(a=>{
      const dot = document.createElement('div');
      dot.className = `appointment-dot ${a.type}`;
      dot.title = `${a.patient} – ${a.type.toUpperCase()}`;
      cell.appendChild(dot);
    });

    cell.addEventListener('click', (e)=>selectDate(e,d));
    daysEl.appendChild(cell);
  }
}

function getAppointmentsForDate(dateString){
  const out = [];
  const map = [
    { key:'day0',  type:'day0'  },
    { key:'day3',  type:'day3'  },
    { key:'day7',  type:'day7'  },
    { key:'day14', type:'day14' },
    { key:'day28', type:'day28' },
  ];
  patientsData.forEach(p=>{
    map.forEach(m=>{
      if (p[m.key] === dateString) {
        out.push({ id:`${p.id}-${m.key}`, patient:p.name, service:p.service, type:m.type, date:dateString });
      }
    });
  });
  return out;
}

function selectDate(e, date){
  selectedDate = date;
  document.querySelectorAll('.calendar-day').forEach(c=>c.classList.remove('selected'));
  e.currentTarget.classList.add('selected');
  updateDailySchedule(date);
}

function updateDailySchedule(date){
  const selectedDateElement = document.getElementById('selected-date');
  const list = document.getElementById('appointment-list');
  if (!selectedDateElement || !list) return;

  selectedDateElement.textContent = date.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const iso = date.toISOString().split('T')[0];
  const appts = getAppointmentsForDate(iso);

  if (appts.length === 0){
    list.innerHTML = `<p>No appointments for this date.</p>`;
    return;
  }
  list.innerHTML = appts.map(a=>{
    const status = getAppointmentStatus(a.id);
    let statusLabel = '';
    if (status === 'completed') statusLabel = '<span class="appt-status done">Done</span>';
    else if (status === 'absent') statusLabel = '<span class="appt-status noshow">No Show</span>';
    return `
      <div class="appointment-item ${a.type}">
        <div class="appointment-info">
          <div><strong>${escapeHtml(a.patient)}</strong> ${statusLabel}</div>
          <div>${escapeHtml(a.service||'')} — <em>${a.type.toUpperCase()}</em></div>
        </div>
        <div class="appointment-actions">
          <button class="btn-view-appointment" data-appointment='${encodeHtmlAttr(JSON.stringify(a))}'>View</button>
          <button class="btn-mark-done" data-appointment-id="${a.id}">Done</button>
          <button class="btn-mark-absent" data-appointment-id="${a.id}">No Show</button>
        </div>
      </div>
    `;
  }).join('');
  addAppointmentActionHandlers();
}

/* Appointment action handlers + simple status storage */
function getAppointmentStatus(id){ return localStorage.getItem(`appointment_status_${id}`)||'scheduled'; }
function setAppointmentStatus(id,s){ localStorage.setItem(`appointment_status_${id}`, s); }

function addAppointmentActionHandlers(){
  document.querySelectorAll('.btn-view-appointment').forEach(b=>{
    b.onclick = ()=>{
      try{
        const a = JSON.parse(decodeHtmlAttr(b.dataset.appointment));
        showAppointmentModal(a);
      }catch(e){ console.error(e); }
    };
  });
  document.querySelectorAll('.btn-mark-done').forEach(b=>{
    b.onclick = async ()=>{
      const appointmentId = b.dataset.appointmentId;
      // Parse appointmentId to get patient_id and day (format: "patientId-dayType")
      const [patientId, dayType] = appointmentId.split('-');
      
      // Get patient data to extract the actual date
      const patient = patientsData.find(p => p.id == patientId);
      if (!patient) {
        showToast('Patient not found!', 'error');
        return;
      }
      
      const date = patient[dayType]; // e.g., patient.day0, patient.day3, etc.
      
      try {
        const res = await fetch('/mark-appointment-done', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            patient_id: patientId,
            day: dayType,
            date: date
          })
        });
        
        const result = await res.json();
        if (result.success) {
          setAppointmentStatus(appointmentId, 'completed');
          showToast('Marked as Done!', 'success');
          if (selectedDate) updateDailySchedule(selectedDate);
        } else {
          showToast(result.error || 'Failed to mark as done', 'error');
        }
      } catch (err) {
        console.error('Error marking as done:', err);
        showToast('Error marking appointment as done', 'error');
      }
    };
  });
  document.querySelectorAll('.btn-mark-absent').forEach(b=>{
    b.onclick = async ()=>{
      const appointmentId = b.dataset.appointmentId;
      // Parse appointmentId to get patient_id and day (format: "patientId-dayType")
      const [patientId, dayType] = appointmentId.split('-');
      
      // Get patient data to extract the actual date
      const patient = patientsData.find(p => p.id == patientId);
      if (!patient) {
        showToast('Patient not found!', 'error');
        return;
      }
      
      const date = patient[dayType]; // e.g., patient.day0, patient.day3, etc.
      
      try {
        const res = await fetch('/mark-appointment-noshow', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            patient_id: patientId,
            day: dayType,
            date: date
          })
        });
        
        const result = await res.json();
        if (result.success) {
          setAppointmentStatus(appointmentId, 'absent');
          showToast('Marked as No Show!', 'warning');
          if (selectedDate) updateDailySchedule(selectedDate);
        } else {
          showToast(result.error || 'Failed to mark as no show', 'error');
        }
      } catch (err) {
        console.error('Error marking as no show:', err);
        showToast('Error marking appointment as no show', 'error');
      }
    };
  });
}
/* ---------- Settings ---------- */
function showTab(tabId) {
  const section = document.querySelector('.content-section.active') || document;
  section.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  section.querySelectorAll('.form-tabs .tab-btn').forEach(btn => {
    const on = btn.getAttribute('onclick') || '';
    btn.classList.toggle('active', on.includes("'" + tabId + "'"));
  });
}
function toast(msg) {
  let t = document.getElementById('copilot-toast');
  if (!t) { t = document.createElement('div'); t.id='copilot-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.cssText="position:fixed;right:16px;bottom:16px;padding:10px 14px;background:#1f883d;color:#fff;border-radius:8px;z-index:9999";
  t.style.display='block';
  setTimeout(()=> t.style.display='none',2000);
}

/* ---------- Appointment Modals (guarded kung walang HTML) ---------- */
function showAppointmentModal(a){
  const modal = document.getElementById('appointmentModal');
  const content = document.getElementById('appointmentDetailsContent');
  if (!modal || !content) {
    alert(`${a.patient}\n${a.service}\n${a.type.toUpperCase()} on ${a.date}`);
    return;
  }
  const status = getAppointmentStatus(a.id);
  let statusLabel = '';
  if (status === 'completed') statusLabel = '<span class="appt-status done">Done</span>';
  else if (status === 'absent') statusLabel = '<span class="appt-status noshow">No Show</span>';
  content.innerHTML = `
    <div class="detail-section">
      <h3>Appointment Details</h3>
      <div class="detail-row"><span class="detail-label">Patient:</span><span class="detail-value">${escapeHtml(a.patient)} ${statusLabel}</span></div>
      <div class="detail-row"><span class="detail-label">Service:</span><span class="detail-value">${escapeHtml(a.service||'')}</span></div>
      <div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${a.type.toUpperCase()}</span></div>
      <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${a.date}</span></div>
      <div class="detail-row"><span class="detail-label">Status:</span><span class="detail-value">${statusLabel||'Scheduled'}</span></div>
      <div class="detail-row"><span class="detail-label">Notes:</span><span class="detail-value">Please confirm patient attendance and mark status accordingly.</span></div>
    </div>`;
  openModal('appointmentModal');
}
function closeAppointmentModal(){ const m=document.getElementById('appointmentModal'); if(m) m.style.display='none'; }

/* ---------- Toast Notification ---------- */
function showToast(message, type='success') {
    let toast = document.getElementById('copilot-toast');
    if (!toast) return;
    toast.className = 'copilot-toast copilot-toast-' + type;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 1800);
}

/* ---------- Utils ---------- */
function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
function encodeHtmlAttr(str=''){ return String(str).replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
function decodeHtmlAttr(str=''){ return String(str).replace(/&quot;/g,'"').replace(/&apos;/g,"'"); }

/* Expose some functions globally if used by HTML */
window.showSection = showSection;
window.showTab = showTab;
window.nextTab = nextTab;
window.previousTab = previousTab;
window.logout = logout;
window.changeMonth = changeMonth;
window.clearSearch = clearSearch;
window.searchPatients = searchPatients;

/* ====================================================================== */
/*                          ANALYTICS CHARTS                            */
/* ====================================================================== */

let charts = {}; // Store chart instances for updates

function initializeAnalyticsCharts() {
  console.log('Starting chart initialization...');
  
  // Check if we're on the dashboard section
  const dashboardSection = document.getElementById('dashboard');
  if (!dashboardSection || !dashboardSection.classList.contains('active')) {
    console.log('Dashboard section not active, skipping chart initialization');
    return;
  }
  
  // Calculate treatment completion statistics
  const completedPatients = calculateCompletedTreatments();
  const serviceData = calculateServiceDistribution();
  
  console.log('Chart data calculated:', { completedPatients, serviceData });
  
  // Update completed count
  const completedCountEl = document.getElementById('completed-count');
  if (completedCountEl) {
    completedCountEl.textContent = completedPatients.completed;
  }
  
  // Initialize all charts
  try {
    initializeCompletionChart(completedPatients);
    initializeDailyProgressChart();
    initializeServiceChart(serviceData);
    initializeWeeklyTrendChart();
    console.log('All charts initialized successfully');
  } catch (error) {
    console.error('Error initializing charts:', error);
  }
  
  // Add loaded class to all chart containers for smooth animation
  setTimeout(() => {
    document.querySelectorAll('.chart-container').forEach(container => {
      container.classList.add('loaded');
    });
    console.log('Added loaded class to chart containers');
  }, 100);
  
  // Update monthly summary for current month
  updateMonthlyReports();
}

function initializeCompletionChart(completedPatients) {
  // Replace doughnut with a horizontal bar chart (counts) for clearer employee-facing view
  const completionCtx = document.getElementById('completionChart').getContext('2d');
  const labels = ['Completed', 'In Progress', 'Not Started'];
  const counts = [completedPatients.completed, completedPatients.inProgress, completedPatients.notStarted];
  if (charts.completion) { charts.completion.destroy(); }
  charts.completion = new Chart(completionCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Patients',
        data: counts,
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x ?? ctx.parsed}` } }
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision:0 }, grid: { color: 'rgba(0,0,0,0.04)' } },
        y: { grid: { display: false }, ticks: { font: { size: 12 } } }
      }
    }
  });
}

function initializeDailyProgressChart() {
  // Use a grouped bar chart for daily progress — easier for employees to read exact counts per day
  const dailyCtx = document.getElementById('dailyProgressChart').getContext('2d');
  const dailyData = calculateDailyProgress();
  if (charts.daily) { charts.daily.destroy(); }
  charts.daily = new Chart(dailyCtx, {
    type: 'bar',
    data: {
      labels: dailyData.days,
      datasets: [{
        label: 'New Patients',
        data: dailyData.newPatients,
        backgroundColor: '#b02a37',
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }, {
        label: 'Completed Treatments',
        data: dailyData.completed,
        backgroundColor: '#2f9e44',
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' }, tooltip: { mode: 'index', intersect: false } },
      interaction: { mode: 'index', axis: 'x', intersect: false },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.04)' } }
      }
    }
  });
}

function initializeServiceChart(serviceData) {
  const serviceCtx = document.getElementById('serviceChart').getContext('2d');
  // Simpler horizontal bar chart with clear labels for employees
  charts.service = new Chart(serviceCtx, {
    type: 'bar',
    data: {
      labels: serviceData.services,
      datasets: [{
        label: 'Patients',
        data: serviceData.counts,
        backgroundColor: '#6f2d3f',
        borderRadius: 6,
        barThickness: 18
      }]
    },
    options: {
      indexAxis: 'y', // horizontal bars
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.x || ctx.parsed}` } } },
      scales: {
        x: { beginAtZero: true, ticks: { precision:0 }, grid: { color: 'rgba(0,0,0,0.04)' } },
        y: { ticks: { font: { size: 12 } }, grid: { display: false } }
      }
    }
  });
}

function initializeWeeklyTrendChart() {
  const weeklyCtx = document.getElementById('weeklyTrendChart').getContext('2d');
  const weeklyData = calculateWeeklyTrends();
  // Use a simple line chart for weekly trends so employees can see progress over weeks
  charts.weekly = new Chart(weeklyCtx, {
    type: 'line',
    data: {
      labels: weeklyData.weeks,
      datasets: [{
        label: 'Patients Started',
        data: weeklyData.started,
        borderColor: '#f59f00',
        backgroundColor: 'rgba(245,159,0,0.08)',
        tension: 0.2,
        pointRadius: 4,
        fill: true
      }, {
        label: 'Treatments Completed',
        data: weeklyData.completed,
        borderColor: '#198754',
        backgroundColor: 'rgba(25,135,84,0.08)',
        tension: 0.2,
        pointRadius: 4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' }, tooltip: { mode: 'index', intersect: false } },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision:0 }, grid: { color: 'rgba(0,0,0,0.04)' } }
      }
    }
  });
}

function updateMonthlyReports() {
  const selectedMonth = document.getElementById('monthSelector').value;
  const periodType = document.getElementById('periodType')?.value || 'month';
  const monthlyData = calculateMonthlyData(selectedMonth, periodType);
  
  // Update summary cards
  document.getElementById('monthlyNewPatients').textContent = monthlyData.newPatients;
  document.getElementById('monthlyCompleted').textContent = monthlyData.completed;
  document.getElementById('monthlyActive').textContent = monthlyData.active;
  document.getElementById('monthlyRate').textContent = monthlyData.completionRate + '%';
  
  // Update charts with filtered data
  updateChartsForMonth(selectedMonth, periodType);
}

function calculateMonthlyData(selectedMonth, periodType = 'month') {
  let filteredPatients = patientsData;
  
  if (selectedMonth !== 'all') {
    if (periodType === 'year') {
      const year = selectedMonth === 'year-current' ? new Date().getFullYear().toString() : selectedMonth;
      filteredPatients = patientsData.filter(p =>
        (p.day0 && p.day0.startsWith(year)) || (p.day28 && p.day28.startsWith(year))
      );
    } else {
      if (selectedMonth === 'current') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        filteredPatients = patientsData.filter(p => 
          (p.day0 && p.day0.startsWith(currentMonth)) ||
          (p.day28 && p.day28.startsWith(currentMonth))
        );
      } else {
        filteredPatients = patientsData.filter(p => 
          (p.day0 && p.day0.startsWith(selectedMonth)) ||
          (p.day28 && p.day28.startsWith(selectedMonth))
        );
      }
    }
  }
  
  const newPatients = filteredPatients.filter(p => {
    if (selectedMonth === 'all') return true;
    if (periodType === 'year') {
      const year = selectedMonth === 'year-current' ? new Date().getFullYear().toString() : selectedMonth;
      return p.day0 && p.day0.startsWith(year);
    }
    if (selectedMonth === 'current') return (p.day0 && p.day0.startsWith(new Date().toISOString().slice(0, 7)));
    return p.day0 && p.day0.startsWith(selectedMonth);
  }).length;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate completed treatments (patients who have reached or passed day 28)
  const completed = filteredPatients.filter(p => {
    return p.day28 && p.day28 <= today;
  }).length;
  
  // Calculate active treatments (patients who started but haven't completed)
  const active = filteredPatients.filter(p => {
    const started = p.day0 && p.day0 <= today;
    const notCompleted = !p.day28 || p.day28 > today;
    return started && notCompleted;
  }).length;
  
  // Calculate overdue patients (missed appointments)
  const overdue = filteredPatients.filter(p => {
    if (!p.day0) return false;
    const day0Date = new Date(p.day0);
    const daysSinceStart = Math.floor((new Date() - day0Date) / (1000 * 60 * 60 * 24));
    
    // Check if any required doses are overdue (allow 3-day grace period)
    if (daysSinceStart >= 6 && (!p.day3 || p.day3 < today)) return true;
    if (daysSinceStart >= 10 && (!p.day7 || p.day7 < today)) return true;
    if (daysSinceStart >= 17 && (!p.day14 || p.day14 < today)) return true;
    if (daysSinceStart >= 31 && (!p.day28 || p.day28 < today)) return true;
    
    return false;
  }).length;
  
  // Calculate adherence rate (patients who received all doses on time)
  const adherent = filteredPatients.filter(p => {
    if (!p.day0) return false;
    
    const day0Date = new Date(p.day0);
    const daysSinceStart = Math.floor((new Date() - day0Date) / (1000 * 60 * 60 * 24));
    
    let adherenceScore = 1; // Day 0 is always given
    let totalDosesRequired = 1;
    
    if (daysSinceStart >= 3) {
      totalDosesRequired++;
      if (p.day3) adherenceScore++;
    }
    if (daysSinceStart >= 7) {
      totalDosesRequired++;
      if (p.day7) adherenceScore++;
    }
    if (daysSinceStart >= 14) {
      totalDosesRequired++;
      if (p.day14) adherenceScore++;
    }
    if (daysSinceStart >= 28) {
      totalDosesRequired++;
      if (p.day28) adherenceScore++;
    }
    
    return adherenceScore === totalDosesRequired;
  }).length;
  
  // Calculate demographics and risk factors
  const demographics = analyzeDemographics(filteredPatients);
  const riskFactors = analyzeRiskFactors(filteredPatients);
  const treatmentTypes = analyzeTreatmentTypes(filteredPatients);
  
  const completionRate = newPatients > 0 ? Math.round((completed / newPatients) * 100) : 0;
  const adherenceRate = newPatients > 0 ? Math.round((adherent / newPatients) * 100) : 0;
  const overdueRate = newPatients > 0 ? Math.round((overdue / newPatients) * 100) : 0;
  
  return {
    newPatients,
    completed,
    active,
    overdue,
    adherent,
    completionRate,
    adherenceRate,
    overdueRate,
    demographics,
    riskFactors,
    treatmentTypes
  };
}

function analyzeDemographics(patients) {
  const ageGroups = {
    children: patients.filter(p => p.age < 18).length,
    adults: patients.filter(p => p.age >= 18 && p.age < 65).length,
    elderly: patients.filter(p => p.age >= 65).length
  };
  
  const genderDistribution = {
    male: patients.filter(p => p.gender === 'Male').length,
    female: patients.filter(p => p.gender === 'Female').length,
    other: patients.filter(p => p.gender === 'Other').length
  };
  
  return { ageGroups, genderDistribution };
}

function analyzeRiskFactors(patients) {
  const biteLocations = {
    high_risk: 0,
    medium_risk: 0,
    low_risk: 0
  };
  
  const animalSources = {};
  const exposureTypes = {};
  
  patients.forEach(p => {
    // Bite location analysis
    if (p.bite_location) {
      const location = p.bite_location.toLowerCase();
      if (location.includes('head') || location.includes('face') || location.includes('neck') || location.includes('eye')) {
        biteLocations.high_risk++;
      } else if (location.includes('hand') || location.includes('finger') || location.includes('arm') || location.includes('wrist')) {
        biteLocations.medium_risk++;
      } else {
        biteLocations.low_risk++;
      }
    }
    
    // Animal source analysis
    if (p.source_of_bite) {
      animalSources[p.source_of_bite] = (animalSources[p.source_of_bite] || 0) + 1;
    }
    
    // Exposure type analysis
    if (p.exposure) {
      exposureTypes[p.exposure] = (exposureTypes[p.exposure] || 0) + 1;
    }
  });
  
  return { biteLocations, animalSources, exposureTypes };
}

function analyzeTreatmentTypes(patients) {
  const serviceTypes = {};
  const vaccinationStatus = {};
  
  patients.forEach(p => {
    if (p.service_type) {
      serviceTypes[p.service_type] = (serviceTypes[p.service_type] || 0) + 1;
    }
    
    if (p.vaccinated) {
      vaccinationStatus[p.vaccinated] = (vaccinationStatus[p.vaccinated] || 0) + 1;
    }
  });
  
  return { serviceTypes, vaccinationStatus };
}

function generateMonthlyReport() {
  const selectedMonth = document.getElementById('monthSelector').value;
  const periodType = document.getElementById('periodType')?.value || 'month';
  const monthlyData = calculateMonthlyData(selectedMonth, periodType);
  const reportSection = document.getElementById('monthlyReportSection');
  const reportContent = document.getElementById('reportContent');
  
  let rangeLabel = 'All Time';
  if (selectedMonth !== 'all') {
    if (periodType === 'year') {
      const year = selectedMonth === 'year-current' ? new Date().getFullYear().toString() : selectedMonth;
      rangeLabel = `Year ${year}`;
    } else if (selectedMonth === 'current') {
      rangeLabel = 'Current Month';
    } else {
      rangeLabel = new Date(selectedMonth + '-01').toLocaleDateString('en', {month: 'long', year: 'numeric'});
    }

  }

  // Get completed patients from the global data
  const completedPatients = globalPatientsData.filter(p => {
    return p.day0 && p.day3 && p.day7 && p.day14 && p.day28;
  });

  // Compare with previous period (simulated data)
  const previousStats = {
    newPatients: Math.max(0, monthlyData.newPatients - 1),
    completed: Math.max(0, monthlyData.completed - 1),
    completionRate: Math.max(0, monthlyData.completionRate - 5)
  };

  // Generate performance indicators
  const getChangeIndicator = (current, previous, label) => {
    const diff = current - previous;
    if (diff > 0) return `${label} increased by ${diff} (${previous > 0 ? ((diff/previous)*100).toFixed(1) : '100'}% improvement)`;
    if (diff < 0) return `${label} decreased by ${Math.abs(diff)} (${previous > 0 ? ((Math.abs(diff)/previous)*100).toFixed(1) : '0'}% reduction)`;
    return `${label} remained unchanged`;
  };

  // Generate enhanced report with completed patients list
  reportContent.innerHTML = `
    <style>
      .enhanced-report { font-family: system-ui, Arial, sans-serif; color:#222; line-height:1.6; }
      .enhanced-report h2 { font-size: 1.75rem; margin: 0 0 .5rem; color:#800020; }
      .enhanced-report h3 { font-size: 1.25rem; margin: 1.5rem 0 .5rem; color:#333; border-bottom: 2px solid #800020; padding-bottom: .25rem; }
      .enhanced-report .meta { color:#555; font-size:.95rem; margin-bottom: 1.5rem; }
      .enhanced-report .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; }
      .enhanced-report .stat-card { background: #f8f9fa; border: 1px solid #dee2e6; padding: 1rem; border-radius: 8px; text-align: center; }
      .enhanced-report .stat-card strong { display: block; font-size: 1.5rem; color: #800020; margin-bottom: .25rem; }
      .enhanced-report .trend { font-size: .9rem; color: #666; }
      .enhanced-report .completed-table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
      .enhanced-report .completed-table th, .enhanced-report .completed-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      .enhanced-report .completed-table th { background-color: #f8f9fa; font-weight: bold; }
      .enhanced-report .status-badge { background: #28a745; color: white; padding: 2px 8px; border-radius: 4px; font-size: .85rem; }
      .enhanced-report ul { margin: .5rem 0 1rem 1.5rem; }
      .enhanced-report .comparison-section { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
    </style>
    <div class="enhanced-report">
      <h2>Monthly Treatment Report</h2>
      <div class="meta">San Lorenzo Animal Bite Center — ${rangeLabel} · Generated ${new Date().toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
      
      <h3>Performance Overview</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <strong>${monthlyData.newPatients}</strong>
          <div>New Patients</div>
          <div class="trend">📈 ${getChangeIndicator(monthlyData.newPatients, previousStats.newPatients, 'Patient intake')}</div>
        </div>
        <div class="stat-card">
          <strong>${monthlyData.completed}</strong>
          <div>Completed Treatments</div>
          <div class="trend">✅ ${getChangeIndicator(monthlyData.completed, previousStats.completed, 'Completed treatments')}</div>
        </div>
        <div class="stat-card">
          <strong>${monthlyData.active}</strong>
          <div>Active Treatments</div>
        </div>
        <div class="stat-card">
          <strong>${monthlyData.completionRate}%</strong>
          <div>Completion Rate</div>
          <div class="trend">📊 ${getChangeIndicator(monthlyData.completionRate, previousStats.completionRate, 'Completion rate')}</div>
        </div>
      </div>

      <h3>Completed Treatments</h3>
      <table class="completed-table">
        <thead>
          <tr>
            <th>Patient Name</th>
            <th>Started</th>
            <th>Completed</th>
            <th>Service Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${completedPatients.length > 0 ? 
            completedPatients.map(p => `
              <tr>
                <td>${p.patient_name}</td>
                <td>${new Date(p.day0).toLocaleDateString()}</td>
                <td>${new Date(p.day28).toLocaleDateString()}</td>
                <td>${p.service_type}</td>
                <td><span class="status-badge">Completed</span></td>
              </tr>
            `).join('') :
            '<tr><td colspan="5" style="text-align: center; color: #666;">No completed treatments in this period</td></tr>'
          }
        </tbody>
      </table>

      <div class="comparison-section">
        <h3>Period Comparison & Analysis</h3>
        <p><strong>Compared to the previous period:</strong></p>
        <ul>
          <li>${getChangeIndicator(monthlyData.newPatients, previousStats.newPatients, 'Patient intake')}</li>
          <li>${getChangeIndicator(monthlyData.completed, previousStats.completed, 'Treatment completions')}</li>
          <li>${getChangeIndicator(monthlyData.completionRate, previousStats.completionRate, 'Overall completion rate')}</li>
        </ul>
        
        <h4>Performance Insights</h4>
        <ul>
          ${monthlyData.completionRate >= 90 ? 
            '<li>🏆 Excellent completion rate - clinic meeting optimal standards</li>' : 
            monthlyData.completionRate >= 75 ? 
            '<li>✅ Good completion rate - within acceptable range</li>' :
            '<li>⚠️ Completion rate needs improvement - consider enhanced follow-up protocols</li>'
          }
          ${monthlyData.overdue > 0 ? 
            `<li>📅 ${monthlyData.overdue} overdue appointments - prioritize patient contact and rescheduling</li>` : 
            '<li>✅ No overdue appointments - excellent schedule management</li>'
          }
          ${completedPatients.length > 5 ? 
            '<li>📈 High treatment completion volume - indicates strong patient compliance</li>' :
            '<li>📊 Monitor patient compliance and follow-up effectiveness</li>'
          }
        </ul>

        <h4>Recommendations</h4>
        <ul>
          ${monthlyData.completionRate < 85 ? 
            '<li>Implement enhanced patient reminder system to improve completion rates</li>' : ''
          }
          ${monthlyData.overdue > 2 ? 
            '<li>Review appointment scheduling system to reduce overdue cases</li>' : ''
          }
          ${monthlyData.newPatients > 15 ? 
            '<li>Ensure adequate vaccine inventory for high-volume periods</li>' : ''
          }
          <li>Continue monitoring treatment adherence and patient outcomes</li>
          <li>Maintain detailed records for quality assurance and reporting</li>
        </ul>
      </div>
    </div>
  `;
  reportSection.style.display = 'block';
}

function getPerformanceClass(rate) {
  if (rate >= 90) return 'excellent';
  if (rate >= 75) return 'good';
  if (rate >= 60) return 'fair';
  return 'poor';
}

function generatePerformanceInsights(data) {
  const insights = [];
  
  // Completion rate insights
  if (data.completionRate >= 95) {
    insights.push("🏆 <strong>Exceptional Performance:</strong> Treatment completion rate exceeds WHO recommendations.");
  } else if (data.completionRate >= 85) {
    insights.push("✅ <strong>Good Performance:</strong> Treatment completion rate meets WHO standards.");
  } else if (data.completionRate >= 70) {
    insights.push("⚠️ <strong>Performance Alert:</strong> Completion rate below optimal - implement follow-up protocols.");
  } else {
    insights.push("🚨 <strong>Critical Alert:</strong> Completion rate critically low - immediate intervention required.");
  }
  
  // Adherence insights
  if (data.adherenceRate >= 95) {
    insights.push("🎯 <strong>Excellent Adherence:</strong> Patients demonstrating superior treatment compliance.");
  } else if (data.adherenceRate < 80) {
    insights.push("📞 <strong>Adherence Concern:</strong> Consider enhanced patient education and reminder systems.");
  }
  
  // Overdue analysis
  if (data.overdueRate > 10) {
    insights.push("⏰ <strong>Scheduling Alert:</strong> High overdue rate indicates need for improved appointment management.");
  }
  
  // Volume analysis
  if (data.newPatients > 20) {
    insights.push("📈 <strong>High Volume Period:</strong> Increased caseload - ensure adequate staffing and vaccine supply.");
  }
  
  return insights.map(insight => `<p>${insight}</p>`).join('');
}

// New: list-based insights (plain text strings)
function generatePerformanceInsightsList(data) {
  const out = [];
  if (data.completionRate >= 95) out.push('Exceptional completion rate exceeds recommended standards.');
  else if (data.completionRate >= 85) out.push('Completion rate meets recommended standards.');
  else if (data.completionRate >= 70) out.push('Completion rate below optimal — strengthen follow-up protocols.');
  else out.push('Completion rate critically low — immediate intervention required.');

  if (data.adherenceRate >= 95) out.push('Excellent patient adherence observed.');
  else if (data.adherenceRate < 80) out.push('Adherence concern — boost education and reminders.');

  if (data.overdueRate > 10) out.push('High overdue rate — improve scheduling and outreach.');
  if (data.newPatients > 20) out.push('High volume period — check staffing and vaccine supply.');
  return out;
}

function generateRiskAssessment(data) {
  if (!data.riskFactors) return '';
  
  const highRiskBites = data.riskFactors.biteLocations.high_risk || 0;
  const totalBites = Object.values(data.riskFactors.biteLocations).reduce((a, b) => a + b, 0);
  const highRiskPercentage = totalBites > 0 ? Math.round((highRiskBites / totalBites) * 100) : 0;
  
  return `
    <div class="risk-section">
      <h4>⚠️ Risk Assessment</h4>
      <div class="risk-analysis">
        <div class="risk-item ${highRiskPercentage > 30 ? 'high-risk' : highRiskPercentage > 15 ? 'medium-risk' : 'low-risk'}">
          <strong>High-Risk Bite Locations:</strong> ${highRiskBites} cases (${highRiskPercentage}%)
          <small>Head, face, neck, and eye area bites requiring immediate attention</small>
        </div>
        <div class="risk-breakdown">
          <strong>Animal Source Distribution:</strong>
          ${Object.entries(data.riskFactors.animalSources).map(([animal, count]) => 
            `<span class="risk-tag">${animal}: ${count}</span>`
          ).join(' ')}
        </div>
      </div>
    </div>
  `;
}

function generateRecommendations(data) {
  const recommendations = [];
  
  // Performance-based recommendations
  if (data.completionRate < 85) {
    recommendations.push({
      priority: 'high',
      category: 'Treatment Completion',
      text: 'Implement automated SMS/call reminders for Day 14 and Day 28 appointments to improve completion rates.',
      action: 'Deploy patient reminder system within 2 weeks'
    });
  }
  
  if (data.adherenceRate < 90) {
    recommendations.push({
      priority: 'medium',
      category: 'Patient Education',
      text: 'Enhance patient counseling on importance of completing full PEP series. Provide multilingual educational materials.',
      action: 'Update patient education protocols'
    });
  }
  
  if (data.overdueRate > 5) {
    recommendations.push({
      priority: 'high',
      category: 'Appointment Management',
      text: 'Review appointment scheduling system and implement flexible scheduling options for working patients.',
      action: 'Evaluate extended clinic hours or weekend availability'
    });
  }
  
  // Volume-based recommendations
  if (data.newPatients > 15) {
    recommendations.push({
      priority: 'medium',
      category: 'Resource Planning',
      text: 'Monitor vaccine inventory levels and ensure adequate stock for projected 4-week treatment cycles.',
      action: 'Review inventory management with pharmacy'
    });
  }
  
  // Risk-based recommendations
  const highRiskBites = data.riskFactors?.biteLocations?.high_risk || 0;
  if (highRiskBites > 3) {
    recommendations.push({
      priority: 'high',
      category: 'Clinical Protocol',
      text: 'High incidence of facial/head bites detected. Ensure immediate assessment and consider HRIG administration per WHO guidelines.',
      action: 'Review high-risk case protocols with medical staff'
    });
  }
  
  // Standard recommendations
  recommendations.push({
    priority: 'standard',
    category: 'Quality Assurance',
    text: 'Conduct monthly case reviews to identify patterns in bite incidents and improve community prevention strategies.',
    action: 'Schedule next quality review meeting'
  });
  
  recommendations.push({
    priority: 'standard',
    category: 'Data Management',
    text: 'Maintain accurate documentation for all PEP treatments to support epidemiological surveillance and reporting.',
    action: 'Verify data completeness in patient records'
  });
  
  return recommendations.map(rec => `
    <div class="recommendation-item ${rec.priority}">
      <div class="rec-header">
        <span class="rec-priority">${rec.priority.toUpperCase()}</span>
        <span class="rec-category">${rec.category}</span>
      </div>
      <p class="rec-text">${rec.text}</p>
      <p class="rec-action"><strong>Action:</strong> ${rec.action}</p>
    </div>
  `).join('');
}

// New: return raw recommendation items for text-only rendering
function buildRecommendations(data) {
  const recommendations = [];
  if (data.completionRate < 85) {
    recommendations.push({
      priority: 'high',
      category: 'Treatment Completion',
      text: 'Implement automated SMS/call reminders for Day 14 and Day 28 appointments to improve completion rates.',
      action: 'Deploy patient reminder system within 2 weeks'
    });
  }
  if (data.adherenceRate < 90) {
    recommendations.push({
      priority: 'medium',
      category: 'Patient Education',
      text: 'Enhance counseling on completing full PEP series; provide multilingual materials.',
      action: 'Update patient education protocols'
    });
  }
  if (data.overdueRate > 5) {
    recommendations.push({
      priority: 'high',
      category: 'Appointment Management',
      text: 'Improve scheduling system; add flexible options for working patients.',
      action: 'Evaluate extended hours or weekend availability'
    });
  }
  if (data.newPatients > 15) {
    recommendations.push({
      priority: 'medium',
      category: 'Resource Planning',
      text: 'Monitor inventory and ensure adequate stock for 4‑week cycles.',
      action: 'Review inventory management with pharmacy'
    });
  }
  const highRiskBites = data.riskFactors?.biteLocations?.high_risk || 0;
  if (highRiskBites > 3) {
    recommendations.push({
      priority: 'high',
      category: 'Clinical Protocol',
      text: 'High incidence of facial/head bites — ensure immediate assessment and HRIG per guidelines.',
      action: 'Review high‑risk protocols with clinical staff'
    });
  }
  recommendations.push({
    priority: 'standard',
    category: 'Quality Assurance',
    text: 'Conduct monthly case reviews to identify patterns and improve prevention strategies.',
    action: 'Schedule next quality review meeting'
  });
  recommendations.push({
    priority: 'standard',
    category: 'Data Management',
    text: 'Maintain accurate documentation for all PEP treatments to support surveillance.',
    action: 'Verify data completeness in patient records'
  });
  return recommendations;
}

function printReport() {
  const reportContent = document.getElementById('reportContent').innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Monthly Treatment Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h3 { color: #800020; }
          ul { margin: 10px 0; }
          li { margin: 5px 0; }
          .report-stats { margin: 20px 0; }
        </style>
      </head>
      <body>
        ${reportContent}
        <hr>
        <p><small>Generated on ${new Date().toLocaleDateString()} - San Lorenzo Animal Bite Center</small></p>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function exportReport() {
  // Export the currently displayed report to PDF using html2pdf (client-side)
  try {
    // Ensure report HTML is up-to-date
    generateMonthlyReport();

    const reportSection = document.getElementById('monthlyReportSection');
    if (!reportSection) {
      alert('No report available to export.');
      return;
    }

    const selectedMonth = document.getElementById('monthSelector')?.value || 'all';
    const filename = `monthly_report_${selectedMonth}.pdf`;

    if (typeof html2pdf === 'undefined') {
      alert('PDF export library not loaded. Please ensure html2pdf is included in the dashboard page.');
      return;
    }

    // Clone the report to avoid layout changes and ensure a clean print area
    const clone = reportSection.cloneNode(true);
    clone.style.display = 'block';
    clone.style.padding = '12px';
    clone.style.background = '#ffffff';
    clone.style.color = '#222';
    clone.style.maxWidth = '800px';
    clone.style.margin = '0 auto';

    const wrapper = document.createElement('div');
    wrapper.appendChild(clone);
    wrapper.style.background = '#ffffff';
    wrapper.style.padding = '8px';

    document.body.appendChild(wrapper);

    const opt = {
      margin:       10,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use html2pdf to generate and save the PDF, then remove the temporary wrapper
    html2pdf().set(opt).from(wrapper).save().then(() => {
      setTimeout(() => { try { document.body.removeChild(wrapper); } catch (e) {} }, 200);
    }).catch(err => {
      console.error('html2pdf error:', err);
      alert('Failed to export PDF. See console for details.');
      try { document.body.removeChild(wrapper); } catch (e) {}
    });

  } catch (err) {
    console.error('exportReport failed:', err);
    alert('An error occurred while exporting the report.');
  }
}

function calculateDailyProgress() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  
  const days = [];
  const newPatients = [];
  const completed = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentMonth}-${day.toString().padStart(2, '0')}`;
    days.push(day.toString());
    
    newPatients.push(patientsData.filter(p => p.day0 === dateStr).length);
    completed.push(patientsData.filter(p => p.day28 === dateStr).length);
  }
  
  return { days, newPatients, completed };
}

function calculateWeeklyTrends() {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const started = [0, 0, 0, 0];
  const completed = [0, 0, 0, 0];
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  patientsData.forEach(patient => {
    if (patient.day0 && patient.day0.startsWith(currentMonth)) {
      const day = parseInt(patient.day0.split('-')[2]);
      const week = Math.min(Math.floor((day - 1) / 7), 3);
      started[week]++;
    }
    
    if (patient.day28 && patient.day28.startsWith(currentMonth)) {
      const day = parseInt(patient.day28.split('-')[2]);
      const week = Math.min(Math.floor((day - 1) / 7), 3);
      completed[week]++;
    }
  });
  
  return { weeks, started, completed };
}

function updateChartsForMonth(selectedMonth, periodType = 'month') {
  // Update charts with filtered data for selected month
  const completedPatients = calculateCompletedTreatments(selectedMonth, periodType);
  const serviceData = calculateServiceDistribution(selectedMonth, periodType);
  
  // Update completion chart
  charts.completion.data.datasets[0].data = [
    completedPatients.completed, 
    completedPatients.inProgress, 
    completedPatients.notStarted
  ];
  charts.completion.update();
  
  // Update service chart
  charts.service.data.labels = serviceData.services;
  charts.service.data.datasets[0].data = serviceData.counts;
  charts.service.update();
  
  // Update daily progress chart
  const dailyData = calculateDailyProgress();
  charts.daily.data.labels = dailyData.days;
  charts.daily.data.datasets[0].data = dailyData.newPatients;
  charts.daily.data.datasets[1].data = dailyData.completed;
  charts.daily.update();
  
  // Update weekly trends
  const weeklyData = calculateWeeklyTrends();
  charts.weekly.data.datasets[0].data = weeklyData.started;
  charts.weekly.data.datasets[1].data = weeklyData.completed;
  charts.weekly.update();
}

function calculateCompletedTreatments(filterMonth = null, periodType = 'month') {
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  
  let filteredPatients = patientsData;
  if (filterMonth && filterMonth !== 'all') {
    if (periodType === 'year') {
      const yearStr = filterMonth === 'year-current' ? new Date().getFullYear().toString() : filterMonth;
      filteredPatients = patientsData.filter(p => (p.day0 && p.day0.startsWith(yearStr)) || (p.day28 && p.day28.startsWith(yearStr)));
    } else {
      const monthStr = filterMonth === 'current' ? new Date().toISOString().slice(0, 7) : filterMonth;
      filteredPatients = patientsData.filter(p => 
        (p.day0 && p.day0.startsWith(monthStr)) ||
        (p.day28 && p.day28.startsWith(monthStr))
      );
    }
  }
  
  filteredPatients.forEach(patient => {
    const today = new Date().toISOString().split('T')[0];
    const day28Date = patient.day28;
    
    if (day28Date && day28Date <= today) {
      completed++;
    } else if (patient.day0 && patient.day0 <= today) {
      inProgress++;
    } else {
      notStarted++;
    }
  });
  
  return { completed, inProgress, notStarted };
}

function calculateServiceDistribution(filterMonth = null, periodType = 'month') {
  let filteredPatients = patientsData;
  if (filterMonth && filterMonth !== 'all') {
    if (periodType === 'year') {
      const yearStr = filterMonth === 'year-current' ? new Date().getFullYear().toString() : filterMonth;
      filteredPatients = patientsData.filter(p => (p.day0 && p.day0.startsWith(yearStr)) || (p.day28 && p.day28.startsWith(yearStr)));
    } else {
      const monthStr = filterMonth === 'current' ? new Date().toISOString().slice(0, 7) : filterMonth;
      filteredPatients = patientsData.filter(p => 
        (p.day0 && p.day0.startsWith(monthStr)) ||
        (p.day28 && p.day28.startsWith(monthStr))
      );
    }
  }
  
  const serviceCounts = {};
  
  filteredPatients.forEach(patient => {
    const service = patient.service || 'Unknown';
    serviceCounts[service] = (serviceCounts[service] || 0) + 1;
  });
  
  const services = Object.keys(serviceCounts);
  const counts = Object.values(serviceCounts);
  
  return { services, counts };
}

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, Chart.js available:', typeof Chart !== 'undefined');
  setTimeout(() => {
    if (typeof Chart !== 'undefined') {
      console.log('Initializing analytics charts...');
      initializeAnalyticsCharts();
    } else {
      console.error('Chart.js not available');
    }
  }, 1000);
});

// ========= AUDIT TRAIL FUNCTIONALITY =========
async function loadAuditTrail() {
  const tbody = document.getElementById('activity-log-body');
  if (!tbody) return;
  
  try {
    const response = await fetch('/audit-trail');
    if (!response.ok) throw new Error('Failed to load audit trail');
    
    const data = await response.json();
    const auditLogs = data.audit_logs || [];
    
    if (auditLogs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No activity yet.</td></tr>';
      return;
    }
    
    tbody.innerHTML = auditLogs.map(log => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const actionClass = log.action === 'LOGIN' ? 'success' : 
                         log.action === 'LOGOUT' ? 'info' : 
                         log.action === 'FAILED_LOGIN' ? 'danger' : '';
      
      return `
        <tr>
          <td>${timestamp}</td>
          <td>${escapeHtml(log.employee_name)} (${escapeHtml(log.employee_id)})</td>
          <td><span class="badge badge-${actionClass}">${log.action}</span></td>
          <td>IP: ${log.ip_address || 'Unknown'}</td>
        </tr>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading audit trail:', error);
    tbody.innerHTML = '<tr><td colspan="4">Error loading activity log.</td></tr>';
  }
}

// Load audit trail when settings activity tab is shown
function showTab(tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  // Show selected tab
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
  
  // Make button active
  event.target.classList.add('active');
  
  // Load audit trail if activity tab is selected
  if (tabId === 'settings-activity') {
    loadAuditTrail();
  }
  
  // Initialize schedule auto-calculation if schedule tab is selected
  if (tabId === 'schedule') {
    initializeScheduleCalculation();
  }
}

// Auto-calculate vaccination schedule dates
function initializeScheduleCalculation() {
  const day0Input = document.querySelector('input[name="day0"]');
  if (!day0Input) return;
  
  day0Input.addEventListener('change', function() {
    const baseDate = new Date(this.value);
    if (!baseDate || isNaN(baseDate.getTime())) return;
    
    // Calculate other dates
    const dates = {
      day3: new Date(baseDate.getTime() + (3 * 24 * 60 * 60 * 1000)),
      day7: new Date(baseDate.getTime() + (7 * 24 * 60 * 60 * 1000)),
      day14: new Date(baseDate.getTime() + (14 * 24 * 60 * 60 * 1000)),
      day28: new Date(baseDate.getTime() + (28 * 24 * 60 * 60 * 1000))
    };
    
    // Format and set the dates
    Object.keys(dates).forEach(day => {
      const input = document.querySelector(`input[name="${day}"]`);
      if (input) {
        input.value = dates[day].toISOString().split('T')[0];
        // Add a subtle animation to show the date was auto-filled
        input.style.background = '#e8f5e8';
        setTimeout(() => {
          input.style.background = '#fafafa';
        }, 1000);
      }
    });
    
    // Show a toast notification
    showToast('Vaccination schedule auto-calculated', 'success');
  });
}

// Toast notification function
function showToast(message, type = 'info') {
  // Remove any existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => document.body.removeChild(toast));

  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
               
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Show toast
  requestAnimationFrame(() => toast.classList.add('show'));
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// Show modal helper function
function showModal(title, content, onClose = null) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="custom-modal-overlay"></div>
        <div class="custom-modal-content">
            <div class="custom-modal-header">
                <h2>${title}</h2>
                <button class="custom-modal-close">&times;</button>
            </div>
            <div class="custom-modal-body">
                ${content}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    const closeModal = () => {
        modal.classList.remove('show');
        document.removeEventListener('keydown', escKeyHandler);
        setTimeout(() => {
            document.body.removeChild(modal);
            if (onClose) onClose();
        }, 300);
    };

    const escKeyHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };

    document.addEventListener('keydown', escKeyHandler);
    modal.querySelector('.custom-modal-close').onclick = closeModal;
    modal.querySelector('.custom-modal-overlay').onclick = closeModal;
}

// Show confirm modal helper function
function showConfirmModal(title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') {
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="custom-modal-overlay"></div>
        <div class="custom-modal-content">
            <div class="custom-modal-header">
                <h2>${title}</h2>
                <button class="custom-modal-close">&times;</button>
            </div>
            <div class="custom-modal-body">
                ${message}
            </div>
            <div class="custom-modal-footer">
                <button class="btn-cancel">${cancelText}</button>
                <button class="btn-confirm">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    const closeModal = () => {
        modal.classList.remove('show');
        document.removeEventListener('keydown', escKeyHandler);
        setTimeout(() => document.body.removeChild(modal), 300);
    };

    const escKeyHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };

    document.addEventListener('keydown', escKeyHandler);
    modal.querySelector('.custom-modal-close').onclick = closeModal;
    modal.querySelector('.custom-modal-overlay').onclick = closeModal;
    modal.querySelector('.btn-cancel').onclick = closeModal;
    modal.querySelector('.btn-confirm').onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };
}

// Show notification helper function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
}
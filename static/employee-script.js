/* ========= VIEW PATIENT: DATA + ACTIONS ========= */

// Utility
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s??''; return d.innerHTML; }

// Modal helpers
function openModal(id){
  const m=document.getElementById(id); if(!m) return;
  m.style.display='block';
  // Remove previous listeners to avoid stacking
  if (m._escListener) document.removeEventListener('keydown', m._escListener);
  if (m._bgListener) m.removeEventListener('click', m._bgListener);
  // ESC key
  m._escListener = function(ev){ if(ev.key==='Escape'){ closeModal(id); document.removeEventListener('keydown',m._escListener); } };
  document.addEventListener('keydown', m._escListener);
  // Click outside modal
  m._bgListener = function(e){ if(e.target===m){ closeModal(id); m.removeEventListener('click',m._bgListener); document.removeEventListener('keydown',m._escListener); } };
  m.addEventListener('click', m._bgListener);
}
function closeModal(id){
  const m=document.getElementById(id);
  if(m) {
    m.style.display='none';
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

  // DELETE (with confirm)
  document.querySelectorAll('.btn-delete').forEach(b=>{
    b.onclick = async ()=>{
      const id=b.getAttribute('data-patient-id');
      const ok = confirm('Are you sure you want to delete this patient?');
      if(!ok) return;
      try{
        const res=await fetch(`/delete-patient/${id}`,{method:'DELETE'});
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        await reloadPatientTableFromAPI();
      }catch(err){
        console.error(err);
        alert('Failed to delete patient.');
      }
    };
  });
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
        <div class="detail-row"><label>Address:</label><span>${show(p.address)}</span></div>
      </div>
      <div class="detail-section">
        <h3>Incident & Service</h3>
        <div class="detail-row"><label>Date of Bite:</label><span>${show(p.date_of_bite)}</span></div>
        <div class="detail-row"><label>Bite Location:</label><span>${show(p.bite_location)}</span></div>
        <div class="detail-row"><label>Place of Bite:</label><span>${show(p.place_of_bite)}</span></div>
        <div class="detail-row"><label>Source of Bite:</label><span>${show(p.source_of_bite)}</span></div>
        <div class="detail-row"><label>Type of Bite:</label><span>${show(p.type_of_bite)}</span></div>
        <div class="detail-row"><label>Source Status:</label><span>${show(p.source_status)}</span></div>
        <div class="detail-row"><label>Exposure:</label><span>${show(p.exposure)}</span></div>
        <div class="detail-row"><label>Service:</label><span>${show(p.service_type)}</span></div>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
          <button class="btn-edit" data-patient-id="${p.id}" title="Edit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7 21H3v-4L17 3z"></path></svg>
          </button>
          <button class="btn-delete" data-patient-id="${p.id}" title="Delete">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path></svg>
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
    b.onclick = async () => {
      const id = b.getAttribute('data-patient-id');
      if (!confirm('Delete this patient?')) return;
      try {
        const res = await fetch(`/delete-patient/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await reloadPatientTableFromAPI();
      } catch (err) {
        console.error(err);
        alert('Failed to delete patient.');
      }
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
    b.onclick = ()=>{
      setAppointmentStatus(b.dataset.appointmentId,'completed');
      showToast('Marked as Done!', 'success');
      if (selectedDate) updateDailySchedule(selectedDate);
    };
  });
  document.querySelectorAll('.btn-mark-absent').forEach(b=>{
    b.onclick = ()=>{
      setAppointmentStatus(b.dataset.appointmentId,'absent');
      showToast('Marked as No Show!', 'warning');
      if (selectedDate) updateDailySchedule(selectedDate);
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
  // Calculate treatment completion statistics
  const completedPatients = calculateCompletedTreatments();
  const serviceData = calculateServiceDistribution();
  
  // Update completed count
  document.getElementById('completed-count').textContent = completedPatients.completed;
  
  // Initialize all charts
  initializeCompletionChart(completedPatients);
  initializeDailyProgressChart();
  initializeServiceChart(serviceData);
  initializeWeeklyTrendChart();
  
  // Update monthly summary for current month
  updateMonthlyReports();
}

function initializeCompletionChart(completedPatients) {
  const completionCtx = document.getElementById('completionChart').getContext('2d');
  charts.completion = new Chart(completionCtx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'In Progress', 'Not Started'],
      datasets: [{
        data: [completedPatients.completed, completedPatients.inProgress, completedPatients.notStarted],
        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function initializeDailyProgressChart() {
  const dailyCtx = document.getElementById('dailyProgressChart').getContext('2d');
  const dailyData = calculateDailyProgress();
  
  charts.daily = new Chart(dailyCtx, {
    type: 'line',
    data: {
      labels: dailyData.days,
      datasets: [{
        label: 'New Patients',
        data: dailyData.newPatients,
        borderColor: '#800020',
        backgroundColor: 'rgba(128, 0, 32, 0.1)',
        tension: 0.4,
        fill: true
      }, {
        label: 'Completed Treatments',
        data: dailyData.completed,
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function initializeServiceChart(serviceData) {
  const serviceCtx = document.getElementById('serviceChart').getContext('2d');
  charts.service = new Chart(serviceCtx, {
    type: 'bar',
    data: {
      labels: serviceData.services,
      datasets: [{
        label: 'Number of Patients',
        data: serviceData.counts,
        backgroundColor: [
          '#800020',
          '#a8324a',
          '#c85a7a',
          '#e882aa',
          '#ffaadd'
        ],
        borderColor: '#fff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function initializeWeeklyTrendChart() {
  const weeklyCtx = document.getElementById('weeklyTrendChart').getContext('2d');
  const weeklyData = calculateWeeklyTrends();
  
  charts.weekly = new Chart(weeklyCtx, {
    type: 'bar',
    data: {
      labels: weeklyData.weeks,
      datasets: [{
        label: 'Patients Started',
        data: weeklyData.started,
        backgroundColor: '#ffc107'
      }, {
        label: 'Treatments Completed',
        data: weeklyData.completed,
        backgroundColor: '#28a745'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function updateMonthlyReports() {
  const selectedMonth = document.getElementById('monthSelector').value;
  const monthlyData = calculateMonthlyData(selectedMonth);
  
  // Update summary cards
  document.getElementById('monthlyNewPatients').textContent = monthlyData.newPatients;
  document.getElementById('monthlyCompleted').textContent = monthlyData.completed;
  document.getElementById('monthlyActive').textContent = monthlyData.active;
  document.getElementById('monthlyRate').textContent = monthlyData.completionRate + '%';
  
  // Update charts with filtered data
  updateChartsForMonth(selectedMonth);
}

function calculateMonthlyData(selectedMonth) {
  let filteredPatients = patientsData;
  
  if (selectedMonth !== 'all') {
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
  
  const newPatients = filteredPatients.filter(p => 
    selectedMonth === 'all' ? true : 
    selectedMonth === 'current' ? 
      (p.day0 && p.day0.startsWith(new Date().toISOString().slice(0, 7))) :
      (p.day0 && p.day0.startsWith(selectedMonth))
  ).length;
  
  const completed = filteredPatients.filter(p => {
    const today = new Date().toISOString().split('T')[0];
    return p.day28 && p.day28 <= today;
  }).length;
  
  const active = filteredPatients.filter(p => {
    const today = new Date().toISOString().split('T')[0];
    return p.day0 && p.day0 <= today && (!p.day28 || p.day28 > today);
  }).length;
  
  const completionRate = newPatients > 0 ? Math.round((completed / newPatients) * 100) : 0;
  
  return {
    newPatients,
    completed,
    active,
    completionRate
  };
}

function generateMonthlyReport() {
  const selectedMonth = document.getElementById('monthSelector').value;
  const monthlyData = calculateMonthlyData(selectedMonth);
  const reportSection = document.getElementById('monthlyReportSection');
  const reportContent = document.getElementById('reportContent');
  
  const monthName = selectedMonth === 'all' ? 'All Time' : 
                   selectedMonth === 'current' ? 'Current Month' :
                   new Date(selectedMonth + '-01').toLocaleDateString('en', {month: 'long', year: 'numeric'});
  
  reportContent.innerHTML = `
    <h3>📊 Monthly Treatment Report - ${monthName}</h3>
    <div class="report-stats">
      <p><strong>📈 Performance Summary:</strong></p>
      <ul>
        <li>New Patients: <strong>${monthlyData.newPatients}</strong></li>
        <li>Completed Treatments: <strong>${monthlyData.completed}</strong></li>
        <li>Active Treatments: <strong>${monthlyData.active}</strong></li>
        <li>Completion Rate: <strong>${monthlyData.completionRate}%</strong></li>
      </ul>
      
      <p><strong>📊 Key Insights:</strong></p>
      <ul>
        <li>${monthlyData.completionRate >= 80 ? '✅ Excellent completion rate!' : 
             monthlyData.completionRate >= 60 ? '⚠️ Good completion rate, room for improvement' : 
             '❗ Low completion rate, attention needed'}</li>
        <li>Average treatment duration: 28 days (Day 0 to Day 28)</li>
        <li>Total active caseload: ${monthlyData.active} patients</li>
      </ul>
      
      <p><strong>📋 Recommendations:</strong></p>
      <ul>
        <li>Monitor patients approaching Day 28 for completion</li>
        <li>Follow up with patients who missed appointments</li>
        <li>Ensure adequate vaccine supply for projected demand</li>
      </ul>
    </div>
  `;
  
  reportSection.style.display = 'block';
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
  // Simple CSV export of current data
  const selectedMonth = document.getElementById('monthSelector').value;
  const monthlyData = calculateMonthlyData(selectedMonth);
  
  const csvContent = `data:text/csv;charset=utf-8,
Month,New Patients,Completed,Active,Completion Rate
${selectedMonth},${monthlyData.newPatients},${monthlyData.completed},${monthlyData.active},${monthlyData.completionRate}%
  `;
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `monthly_report_${selectedMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

function updateChartsForMonth(selectedMonth) {
  // Update charts with filtered data for selected month
  const completedPatients = calculateCompletedTreatments(selectedMonth);
  const serviceData = calculateServiceDistribution(selectedMonth);
  
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

function calculateCompletedTreatments(filterMonth = null) {
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  
  let filteredPatients = patientsData;
  if (filterMonth && filterMonth !== 'all') {
    const monthStr = filterMonth === 'current' ? new Date().toISOString().slice(0, 7) : filterMonth;
    filteredPatients = patientsData.filter(p => 
      (p.day0 && p.day0.startsWith(monthStr)) ||
      (p.day28 && p.day28.startsWith(monthStr))
    );
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

function calculateServiceDistribution(filterMonth = null) {
  let filteredPatients = patientsData;
  if (filterMonth && filterMonth !== 'all') {
    const monthStr = filterMonth === 'current' ? new Date().toISOString().slice(0, 7) : filterMonth;
    filteredPatients = patientsData.filter(p => 
      (p.day0 && p.day0.startsWith(monthStr)) ||
      (p.day28 && p.day28.startsWith(monthStr))
    );
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
  setTimeout(() => {
    if (typeof Chart !== 'undefined') {
      initializeAnalyticsCharts();
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
}
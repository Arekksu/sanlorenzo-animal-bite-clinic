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
        <td class="action-buttons">
          <button class="btn-view" data-patient-id="${p.id}" title="View Details">
            <img src="/static/images/icons/eye_2x612-removebg-preview.png" class="action-icon" alt="View">
          </button>
          <button class="btn-edit" data-patient-id="${p.id}" title="Edit Patient">
            <img src="/static/images/icons/png-transparent-computer-icons-editing-icon-design-png-clipart-thumbnail-removebg-preview.png" class="action-icon" alt="Edit">
          </button>
          <button class="btn-delete" data-patient-id="${p.id}" title="Delete Patient">
            <img src="/static/images/icons/images-removebg-preview.png" class="action-icon" alt="Delete">
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
  document.querySelectorAll('.btn-view').forEach(b=>{
    b.onclick = async () => {
      const id = b.getAttribute('data-patient-id');
      await viewPatientDetails(id);
    };
  });
  document.querySelectorAll('.btn-edit').forEach(b=>{
    b.onclick = () => alert('Edit endpoint not implemented yet.');
  });
  document.querySelectorAll('.btn-delete').forEach(b=>{
    b.onclick = async () => {
      const id = b.getAttribute('data-patient-id');
      if (!confirm('Delete this patient?')) return;
      try{
        const res = await fetch(`/delete-patient/${id}`, { method:'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await reloadPatientTableFromAPI();
      }catch(err){
        alert('Failed to delete patient.');
        console.error(err);
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
  list.innerHTML = appts.map(a=>`
    <div class="appointment-item ${a.type}">
      <div class="appointment-info">
        <div><strong>${escapeHtml(a.patient)}</strong></div>
        <div>${escapeHtml(a.service||'')} — <em>${a.type.toUpperCase()}</em></div>
      </div>
      <div class="appointment-actions">
        <button class="btn-view-appointment" data-appointment='${encodeHtmlAttr(JSON.stringify(a))}'>View</button>
        <button class="btn-mark-done" data-appointment-id="${a.id}">Done</button>
        <button class="btn-mark-absent" data-appointment-id="${a.id}">No Show</button>
      </div>
    </div>
  `).join('');
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
      if (selectedDate) updateDailySchedule(selectedDate);
    };
  });
  document.querySelectorAll('.btn-mark-absent').forEach(b=>{
    b.onclick = ()=>{
      setAppointmentStatus(b.dataset.appointmentId,'absent');
      if (selectedDate) updateDailySchedule(selectedDate);
    };
  });
}

/* ---------- Appointment Modals (guarded kung walang HTML) ---------- */
function showAppointmentModal(a){
  const modal = document.getElementById('appointmentModal');
  const content = document.getElementById('appointmentDetailsContent');
  if (!modal || !content) {
    alert(`${a.patient}\n${a.service}\n${a.type.toUpperCase()} on ${a.date}`);
    return;
  }
  content.innerHTML = `
    <div class="detail-section">
      <h3>Appointment</h3>
      <div class="detail-row"><span class="detail-label">Patient:</span><span class="detail-value">${escapeHtml(a.patient)}</span></div>
      <div class="detail-row"><span class="detail-label">Service:</span><span class="detail-value">${escapeHtml(a.service||'')}</span></div>
      <div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">${a.type.toUpperCase()}</span></div>
      <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${a.date}</span></div>
    </div>`;
  modal.style.display = 'block';
}
function closeAppointmentModal(){ const m=document.getElementById('appointmentModal'); if(m) m.style.display='none'; }

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
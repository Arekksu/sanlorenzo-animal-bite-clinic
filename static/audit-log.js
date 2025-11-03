let auditLogs = [];
let searchTimeout = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let filteredLogs = [];

// Load audit logs from server
function loadAuditLogs() {
    const previousLength = filteredLogs.length;
    const searchTerm = document.getElementById('audit-search')?.value || '';
    
    fetch('/audit-trail')
        .then(response => response.json())
        .then(data => {
            auditLogs = data;
            
            // Determine if we need to reset page number
            if (searchTerm) {
                // When searching, apply filter to see if results count changed
                const newFilteredLength = auditLogs.filter(log => 
                    log.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    new Date(log.timestamp).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase())
                ).length;
                
                // Reset to page 1 if results count changed during search
                if (newFilteredLength !== previousLength) {
                    currentPage = 1;
                }
            } else if (data.length !== previousLength) {
                // Reset to page 1 if total count changed while not searching
                currentPage = 1;
            }
            
            displayAuditLogs(auditLogs, searchTerm);
        })
        .catch(error => {
            console.error('Error loading audit logs:', error);
            document.getElementById('audit-log-body').innerHTML = `
                <tr>
                    <td colspan="4" class="audit-log-empty">Error loading audit logs. Please try refreshing the page.</td>
                </tr>
            `;
            
            // Clear pagination on error
            document.getElementById('audit-pagination').innerHTML = '';
        });
}

// Display audit logs with optional filter
function displayAuditLogs(logs, searchTerm = '') {
    const tbody = document.getElementById('audit-log-body');
    if (!tbody) return;

    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        filteredLogs = logs.filter(log => 
            log.employee_name.toLowerCase().includes(searchTerm) ||
            log.action.toLowerCase().includes(searchTerm) ||
            new Date(log.timestamp).toLocaleString().toLowerCase().includes(searchTerm)
        );
    } else {
        filteredLogs = [...logs];
    }

    if (filteredLogs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="audit-log-empty">
                    ${searchTerm ? 'No matching records found' : 'No audit logs available'}
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentLogs = filteredLogs.slice(startIndex, endIndex);

    tbody.innerHTML = currentLogs.map(log => `
        <tr>
            <td>${formatDateTime(log.timestamp)}</td>
            <td>${escapeHtml(log.employee_name)}</td>
            <td>${escapeHtml(log.action)}</td>
            <td>${escapeHtml(log.ip_address)}</td>
        </tr>
    `).join('');

    updatePagination();
}

// Real-time search handling
function handleAuditSearch(event) {
    const searchTerm = event.target.value;
    
    // Clear any pending search
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Set a small delay to avoid too many re-renders
    searchTimeout = setTimeout(() => {
        currentPage = 1; // Reset to first page on search
        displayAuditLogs(auditLogs, searchTerm);
    }, 100);
}

// Format date for display
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Print audit logs
function printAuditLogs() {
    // Create a temporary print area
    let printArea = document.createElement('div');
    printArea.id = 'printArea';
    
    // Add header
    printArea.innerHTML = `
        <div class="print-header">
            <h2>San Lorenzo Animal Bite Center</h2>
            <p>Activity Log Report</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
    `;

    // Create table
    let table = document.createElement('table');
    table.className = 'print-table';
    
    // Add table header
    table.innerHTML = `
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>IP Address</th>
            </tr>
        </thead>
        <tbody>
            ${auditLogs.map(log => `
                <tr>
                    <td>${formatDateTime(log.timestamp)}</td>
                    <td>${escapeHtml(log.employee_name)}</td>
                    <td>${escapeHtml(log.action)}</td>
                    <td>${escapeHtml(log.ip_address)}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    // Add table to print area
    printArea.appendChild(table);
    
    // Add footer
    printArea.innerHTML += `
        <div class="print-footer">
            <p>Total Records: ${auditLogs.length}</p>
        </div>
    `;
    
    // Add to document, print, then remove
    document.body.appendChild(printArea);
    window.print();
    document.body.removeChild(printArea);
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Update pagination controls
function updatePagination() {
    const paginationContainer = document.getElementById('audit-pagination');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    
    // Generate pagination HTML
    let paginationHtml = '';
    
    // Previous button
    paginationHtml += `
        <button class="page-btn" 
                onclick="changePage(${currentPage - 1})"
                ${currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
    `;

    // Page numbers with ellipsis
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHtml += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}"
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHtml += '<span class="page-ellipsis">...</span>';
        }
    }

    // Next button
    paginationHtml += `
        <button class="page-btn" 
                onclick="changePage(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;

    paginationContainer.innerHTML = paginationHtml;
}

// Change page and update display
function changePage(newPage) {
    if (newPage < 1 || newPage > Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)) {
        return;
    }
    currentPage = newPage;
    displayAuditLogs(auditLogs, document.getElementById('audit-search')?.value || '');
}

// Auto refresh logs every minute
function startAutoRefresh() {
    setInterval(loadAuditLogs, 60000);
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('audit-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleAuditSearch);
    }
    loadAuditLogs();
    startAutoRefresh();
});
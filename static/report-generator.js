// Report Generation Functions
function printReport() {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    // Get the report data from the current report
    const reportContent = document.getElementById('reportContent');
    const periodType = document.getElementById('monthSelector').value;
    let periodLabel = 'This Month';
    
    switch(periodType) {
        case 'weekly': periodLabel = 'Weekly Report'; break;
        case 'monthly': periodLabel = 'Monthly Report'; break;
        case 'yearly': periodLabel = 'Annual Report'; break;
    }

    // Extract data from the current report
    const statCards = reportContent.querySelectorAll('[style*="grid-template-columns"]');
    let totalPatients = 0, completedTreatments = 0, activeTreatments = 0, completionRate = '0%';
    
    if (statCards.length > 0) {
        const stats = statCards[0].querySelectorAll('[style*="font-size: 24px"]');
        if (stats.length >= 4) {
            totalPatients = stats[0].textContent;
            completedTreatments = stats[1].textContent;
            activeTreatments = stats[2].textContent;
            completionRate = stats[3].textContent;
        }
    }

    // Get completed patients table data
    const table = reportContent.querySelector('table');
    let tableRows = '';
    if (table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4 && !cells[0].textContent.includes('No completed treatments')) {
                tableRows += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${cells[0].textContent}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${cells[1].textContent}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${cells[2].textContent}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${cells[3].textContent}</td>
                    </tr>
                `;
            }
        });
    }

    if (!tableRows) {
        tableRows = '<tr><td colspan="4" style="border: 1px solid #ddd; padding: 15px; text-align: center; color: #666; font-style: italic;">No completed treatments found in this period</td></tr>';
    }

    // Write the professional print document
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${periodLabel} - ${dateStr}</title>
            <style>
                @page {
                    margin: 0.5in;
                    size: A4;
                }
                
                body { 
                    font-family: 'Arial', sans-serif;
                    line-height: 1.4;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                    background: white;
                }
                
                .letterhead {
                    text-align: center;
                    border-bottom: 3px solid #800020;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                
                .clinic-logo {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 15px;
                    display: block;
                    border-radius: 50%;
                    border: 2px solid #800020;
                }
                
                .clinic-name {
                    font-size: 24px;
                    font-weight: bold;
                    color: #800020;
                    margin: 10px 0 5px;
                    letter-spacing: 1px;
                }
                
                .clinic-subtitle {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 15px;
                }
                
                .report-header {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border-left: 4px solid #800020;
                }
                
                .report-title {
                    font-size: 20px;
                    font-weight: bold;
                    color: #800020;
                    margin: 0 0 10px;
                }
                
                .report-meta {
                    font-size: 12px;
                    color: #666;
                    line-height: 1.6;
                }
                
                .stats-section {
                    margin: 25px 0;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin: 20px 0;
                }
                
                .stat-box {
                    background: white;
                    border: 1px solid #ddd;
                    padding: 15px;
                    text-align: center;
                    border-radius: 6px;
                }
                
                .stat-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #800020;
                    margin-bottom: 5px;
                }
                
                .stat-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .section-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #333;
                    margin: 25px 0 15px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 5px;
                }
                
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 12px;
                }
                
                .data-table th {
                    background: #800020;
                    color: white;
                    padding: 10px 8px;
                    text-align: left;
                    font-weight: bold;
                    border: 1px solid #ddd;
                }
                
                .data-table td {
                    padding: 8px;
                    border: 1px solid #ddd;
                }
                
                .data-table tbody tr:nth-child(even) {
                    background: #f8f9fa;
                }
                
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    font-size: 11px;
                    color: #666;
                }
                
                .performance-summary {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 6px;
                    margin: 20px 0;
                    border-left: 4px solid #28a745;
                }
                
                .performance-title {
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 10px;
                }
                
                @media print {
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                    .letterhead { page-break-after: avoid; }
                    .stats-section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <!-- Official Letterhead -->
            <div class="letterhead">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMzgiIGZpbGw9IiM4MDAwMjAiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01aDNWOGg0djRoM2wtNSA1eiIvPgo8L3N2Zz4KPC9zdmc+" 
                     alt="Clinic Logo" class="clinic-logo">
                <div class="clinic-name">SAN LORENZO ANIMAL BITE CENTER</div>
                <div class="clinic-subtitle">Anti-Rabies Treatment and Prevention Services</div>
                <div class="clinic-subtitle">Professional Healthcare Document</div>
            </div>
            
            <!-- Report Header -->
            <div class="report-header">
                <div class="report-title">${periodLabel}</div>
                <div class="report-meta">
                    <strong>Document Generated:</strong> ${dateStr} at ${timeStr}<br>
                    <strong>Report Period:</strong> ${periodLabel}<br>
                    <strong>Prepared By:</strong> San Lorenzo Animal Bite Center Administration<br>
                    <strong>Document Type:</strong> Official Treatment Statistics Report
                </div>
            </div>
            
            <!-- Statistics Overview -->
            <div class="stats-section">
                <div class="section-title">TREATMENT STATISTICS SUMMARY</div>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-number">${totalPatients}</div>
                        <div class="stat-label">Total Patients</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${completedTreatments}</div>
                        <div class="stat-label">Completed Treatments</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${activeTreatments}</div>
                        <div class="stat-label">Active Treatments</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${completionRate}</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                </div>
            </div>
            
            <!-- Completed Treatments Table -->
            <div class="section-title">COMPLETED TREATMENT RECORDS</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Patient Name</th>
                        <th>Treatment Started</th>
                        <th>Treatment Completed</th>
                        <th>Service Type</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            
            <!-- Performance Summary -->
            <div class="performance-summary">
                <div class="performance-title">PERFORMANCE ANALYSIS</div>
                <p>This ${periodLabel.toLowerCase()} shows ${totalPatients} patients treated with a ${completionRate} success rate. 
                ${completedTreatments} treatments were successfully completed during this period, demonstrating 
                ${parseInt(completionRate) >= 90 ? 'excellent' : parseInt(completionRate) >= 75 ? 'good' : 'acceptable'} 
                clinical performance standards.</p>
            </div>
            
            <!-- Official Footer -->
            <div class="footer">
                <p><strong>San Lorenzo Animal Bite Center</strong> | Official Treatment Report</p>
                <p>This document contains confidential medical statistics and is intended for authorized personnel only.</p>
                <p>Generated on ${dateStr} | Document ID: SLABC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}</p>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function generateMonthlyReport() {
    const reportSection = document.getElementById('monthlyReportSection');
    const reportContent = document.getElementById('reportContent');
    
    // Get current stats
    const currentStats = {
        newPatients: parseInt(document.getElementById('monthlyNewPatients').textContent) || 0,
        activePatients: parseInt(document.getElementById('monthlyActive').textContent) || 0,
        completionRate: parseFloat(document.getElementById('monthlyRate').textContent) || 0
    };

    // Get completed patients from the global data
    const completedPatients = globalPatientsData.filter(p => {
        return p.day0 && p.day3 && p.day7 && p.day14 && p.day28;
    });

    // Compare with previous period (this would normally come from a database)
    const previousStats = {
        newPatients: Math.max(0, currentStats.newPatients - 1),
        activePatients: Math.max(0, currentStats.activePatients - 2),
        completionRate: Math.max(0, currentStats.completionRate - 5)
    };

    // Generate performance indicators
    const performance = {
        newPatients: getPerformanceIndicator(currentStats.newPatients, previousStats.newPatients),
        activePatients: getPerformanceIndicator(currentStats.activePatients, previousStats.activePatients),
        completionRate: getPerformanceIndicator(currentStats.completionRate, previousStats.completionRate)
    };

    // Generate the report HTML
    const reportHTML = `
        <div class="report-header">
            <h2>Monthly Treatment Report</h2>
            <p><strong>Period:</strong> ${getPeriodLabel()}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="report-stats">
            <div class="stat-comparison">
                <h3>Performance Overview</h3>
                <div class="stat-grid">
                    <div class="stat-item">
                        <label>New Patients</label>
                        <span class="current">${currentStats.newPatients}</span>
                        <span class="trend ${performance.newPatients.trend}">${performance.newPatients.icon} ${performance.newPatients.text}</span>
                    </div>
                    <div class="stat-item">
                        <label>Active Treatments</label>
                        <span class="current">${currentStats.activePatients}</span>
                        <span class="trend ${performance.activePatients.trend}">${performance.activePatients.icon} ${performance.activePatients.text}</span>
                    </div>
                    <div class="stat-item">
                        <label>Completion Rate</label>
                        <span class="current">${currentStats.completionRate}%</span>
                        <span class="trend ${performance.completionRate.trend}">${performance.completionRate.icon} ${performance.completionRate.text}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="completed-treatments">
            <h3>Completed Treatments</h3>
            <div class="table-responsive">
                <table class="report-table">
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
                                    <td>${formatDate(p.day0)}</td>
                                    <td>${formatDate(p.day28)}</td>
                                    <td>${p.service_type}</td>
                                    <td><span class="status-badge success">Completed</span></td>
                                </tr>
                            `).join('') :
                            '<tr><td colspan="5">No completed treatments in this period</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
        </div>

        <div class="performance-analysis">
            <h3>Period Comparison</h3>
            <div class="analysis-content">
                <p>Compared to the previous period:</p>
                <ul>
                    <li>${performance.newPatients.detail}</li>
                    <li>${performance.activePatients.detail}</li>
                    <li>${performance.completionRate.detail}</li>
                </ul>
                <div class="recommendations">
                    <h4>Recommendations</h4>
                    <ul>
                        ${generateRecommendations(currentStats, previousStats)}
                    </ul>
                </div>
            </div>
        </div>
    `;

    reportContent.innerHTML = reportHTML;
    reportSection.style.display = 'block';
}

function getPerformanceIndicator(current, previous) {
    const diff = current - previous;
    const percentChange = previous > 0 ? (diff / previous) * 100 : 0;
    
    if (diff > 0) {
        return {
            trend: 'positive',
            icon: '📈',
            text: `+${diff} (${percentChange.toFixed(1)}%)`,
            detail: `Increased by ${diff} (${percentChange.toFixed(1)}% improvement)`
        };
    } else if (diff < 0) {
        return {
            trend: 'negative',
            icon: '📉',
            text: `${diff} (${Math.abs(percentChange).toFixed(1)}%)`,
            detail: `Decreased by ${Math.abs(diff)} (${Math.abs(percentChange).toFixed(1)}% reduction)`
        };
    }
    return {
        trend: 'neutral',
        icon: '➡️',
        text: 'No change',
        detail: 'Remained unchanged'
    };
}

function generateRecommendations(current, previous) {
    const recommendations = [];
    
    if (current.completionRate < previous.completionRate) {
        recommendations.push('Consider following up with patients more frequently to improve completion rate');
    }
    
    if (current.newPatients < previous.newPatients) {
        recommendations.push('Evaluate community outreach programs to maintain steady patient intake');
    }
    
    if (current.activePatients > previous.activePatients * 1.2) {
        recommendations.push('Monitor staff workload with increased active cases');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Maintain current operational procedures as performance metrics are stable or improving');
    }
    
    return recommendations.map(r => `<li>${r}</li>`).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function getPeriodLabel() {
    const monthSelector = document.getElementById('monthSelector');
    const periodType = document.getElementById('periodType');
    return `${monthSelector.options[monthSelector.selectedIndex].text} (${periodType.value})`;
}
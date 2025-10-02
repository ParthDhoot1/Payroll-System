let currentTab = 'employees';
let employees = [];

document.addEventListener('DOMContentLoaded', () => {
    initYearSelects();
    loadEmployees();
    setCurrentMonthYear();
});

function initYearSelects() {
    const currentYear = new Date().getFullYear();
    const yearSelects = ['payrollYear', 'reportYear'];
    
    yearSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        for (let i = currentYear - 2; i <= currentYear + 1; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === currentYear) option.selected = true;
            select.appendChild(option);
        }
    });
}

function setCurrentMonthYear() {
    const now = new Date();
    document.getElementById('payrollMonth').value = now.getMonth() + 1;
    document.getElementById('reportMonth').value = now.getMonth() + 1;
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
        btn.classList.add('text-gray-600');
    });
    
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    event.target.classList.remove('text-gray-600');
    event.target.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
    
    currentTab = tabName;
    
    if (tabName === 'employees') loadEmployees();
    else if (tabName === 'attendance') loadAttendance();
    else if (tabName === 'leaves') loadLeaves();
    else if (tabName === 'payroll') loadPayroll();
    else if (tabName === 'reports') loadReports();
}

async function loadEmployees() {
    try {
        const response = await fetch('/api/admin/employees');
        employees = await response.json();
        
        const html = `
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${employees.map(emp => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${emp.id}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${emp.name}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${emp.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${emp.department}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${emp.designation}</td>
                            <td class="px-6 py-4 whitespace-nowrap">₹${emp.basic_salary}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${emp.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('employeesList').innerHTML = html;
        
        const select = document.getElementById('attendanceEmployee');
        select.innerHTML = '<option value="">Select Employee</option>' +
            employees.filter(e => e.is_active).map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

function showAddEmployeeModal() {
    document.getElementById('addEmployeeModal').classList.remove('hidden');
}

function hideAddEmployeeModal() {
    document.getElementById('addEmployeeModal').classList.add('hidden');
    document.getElementById('addEmployeeForm').reset();
}

document.getElementById('addEmployeeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('empName').value,
        email: document.getElementById('empEmail').value,
        phone: document.getElementById('empPhone').value,
        department: document.getElementById('empDept').value,
        designation: document.getElementById('empDesig').value,
        date_of_joining: document.getElementById('empDOJ').value,
        basic_salary: document.getElementById('empBasic').value,
        hra: document.getElementById('empHRA').value || 0,
        da: document.getElementById('empDA').value || 0,
        ta: document.getElementById('empTA').value || 0,
        pf_deduction: document.getElementById('empPF').value || 0,
        tax_deduction: document.getElementById('empTax').value || 0,
        username: document.getElementById('empUsername').value,
        password: document.getElementById('empPassword').value
    };
    
    try {
        const response = await fetch('/api/admin/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (result.success) {
            hideAddEmployeeModal();
            loadEmployees();
            alert('Employee added successfully!');
        }
    } catch (error) {
        console.error('Error adding employee:', error);
        alert('Failed to add employee');
    }
});

async function markAttendance() {
    const employeeId = document.getElementById('attendanceEmployee').value;
    const date = document.getElementById('attendanceDate').value;
    const status = document.getElementById('attendanceStatus').value;
    
    if (!employeeId || !date) {
        alert('Please select employee and date');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_id: employeeId, date, status })
        });
        
        const result = await response.json();
        if (result.success) {
            alert('Attendance marked successfully!');
            loadAttendance();
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        alert('Failed to mark attendance');
    }
}

async function loadAttendance() {
    try {
        const response = await fetch('/api/admin/attendance');
        const records = await response.json();
        
        const html = `
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${records.map(rec => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${rec.employee_name}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${rec.date}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    rec.status === 'present' ? 'bg-green-100 text-green-800' :
                                    rec.status === 'absent' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }">
                                    ${rec.status}
                                </span>
                            </td>
                            <td class="px-6 py-4">${rec.remarks || ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('attendanceList').innerHTML = html;
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

async function loadLeaves() {
    try {
        const response = await fetch('/api/admin/leaves');
        const leaves = await response.json();
        
        const html = leaves.map(leave => `
            <div class="border-b py-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold">${leave.employee_name}</h3>
                        <p class="text-sm text-gray-600">${leave.leave_type} - ${leave.days} days</p>
                        <p class="text-sm text-gray-600">${leave.start_date} to ${leave.end_date}</p>
                        <p class="text-sm mt-2">${leave.reason}</p>
                    </div>
                    <div class="flex gap-2">
                        ${leave.status === 'pending' ? `
                            <button onclick="updateLeaveStatus(${leave.id}, 'approved')" 
                                    class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Approve</button>
                            <button onclick="updateLeaveStatus(${leave.id}, 'rejected')" 
                                    class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Reject</button>
                        ` : `
                            <span class="px-3 py-1 rounded text-sm ${
                                leave.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }">${leave.status}</span>
                        `}
                    </div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('leavesList').innerHTML = html || '<p class="text-gray-500">No leave applications</p>';
    } catch (error) {
        console.error('Error loading leaves:', error);
    }
}

async function updateLeaveStatus(leaveId, status) {
    try {
        const response = await fetch('/api/admin/leaves', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leave_id: leaveId, status })
        });
        
        const result = await response.json();
        if (result.success) {
            loadLeaves();
        }
    } catch (error) {
        console.error('Error updating leave:', error);
    }
}

async function processPayroll() {
    const month = document.getElementById('payrollMonth').value;
    const year = document.getElementById('payrollYear').value;
    
    if (confirm(`Process payroll for ${month}/${year}? This will calculate salaries for all active employees.`)) {
        try {
            const response = await fetch('/api/admin/payroll/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, year })
            });
            
            const result = await response.json();
            if (result.success) {
                alert(result.message);
                loadPayroll();
            }
        } catch (error) {
            console.error('Error processing payroll:', error);
            alert('Failed to process payroll');
        }
    }
}

async function loadPayroll() {
    const month = document.getElementById('payrollMonth').value;
    const year = document.getElementById('payrollYear').value;
    
    try {
        const response = await fetch(`/api/admin/payroll?month=${month}&year=${year}`);
        const payrolls = await response.json();
        
        const html = `
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Salary</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${payrolls.map(p => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${p.employee_name}</td>
                            <td class="px-6 py-4 whitespace-nowrap">₹${p.gross_salary.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">₹${p.total_deductions.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap font-semibold">₹${p.net_salary.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    ${p.status}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('payrollList').innerHTML = html || '<p class="text-gray-500">No payroll records found</p>';
    } catch (error) {
        console.error('Error loading payroll:', error);
    }
}

async function loadReports() {
    const month = document.getElementById('reportMonth').value;
    const year = document.getElementById('reportYear').value;
    
    try {
        const response = await fetch(`/api/admin/reports/summary?month=${month}&year=${year}`);
        const summary = await response.json();
        
        const html = `
            <div class="bg-blue-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold text-blue-800 mb-2">Total Employees</h3>
                <p class="text-3xl font-bold text-blue-900">${summary.total_employees}</p>
            </div>
            <div class="bg-green-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold text-green-800 mb-2">Gross Salary</h3>
                <p class="text-3xl font-bold text-green-900">₹${summary.total_gross_salary.toFixed(2)}</p>
            </div>
            <div class="bg-red-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold text-red-800 mb-2">Total Deductions</h3>
                <p class="text-3xl font-bold text-red-900">₹${summary.total_deductions.toFixed(2)}</p>
            </div>
            <div class="bg-purple-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold text-purple-800 mb-2">Net Salary</h3>
                <p class="text-3xl font-bold text-purple-900">₹${summary.total_net_salary.toFixed(2)}</p>
            </div>
        `;
        
        document.getElementById('reportSummary').innerHTML = html;
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

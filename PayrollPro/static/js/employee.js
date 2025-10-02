let currentTab = 'profile';

document.addEventListener('DOMContentLoaded', () => {
    initYearSelects();
    loadProfile();
    setCurrentMonthYear();
});

function initYearSelects() {
    const currentYear = new Date().getFullYear();
    const select = document.getElementById('attendanceYear');
    
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === currentYear) option.selected = true;
        select.appendChild(option);
    }
}

function setCurrentMonthYear() {
    const now = new Date();
    document.getElementById('attendanceMonth').value = now.getMonth() + 1;
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
    
    if (tabName === 'profile') loadProfile();
    else if (tabName === 'payslips') loadPayslips();
    else if (tabName === 'leaves') loadLeaves();
    else if (tabName === 'attendance') loadAttendance();
}

async function loadProfile() {
    try {
        const response = await fetch('/api/employee/profile');
        const profile = await response.json();
        
        const html = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-500">Name</label>
                    <p class="text-lg font-semibold">${profile.name}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Email</label>
                    <p class="text-lg">${profile.email}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Phone</label>
                    <p class="text-lg">${profile.phone}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Department</label>
                    <p class="text-lg">${profile.department}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Designation</label>
                    <p class="text-lg">${profile.designation}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Date of Joining</label>
                    <p class="text-lg">${profile.date_of_joining}</p>
                </div>
                <div class="border-t pt-4 mt-4">
                    <h3 class="text-xl font-bold mb-4">Salary Structure</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Basic Salary</label>
                            <p class="text-lg font-semibold">₹${profile.basic_salary}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">HRA</label>
                            <p class="text-lg">₹${profile.hra}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">DA</label>
                            <p class="text-lg">₹${profile.da}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">TA</label>
                            <p class="text-lg">₹${profile.ta}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Other Allowances</label>
                            <p class="text-lg">₹${profile.other_allowances}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Gross Salary</label>
                            <p class="text-lg font-bold text-green-600">₹${parseFloat(profile.basic_salary) + parseFloat(profile.hra) + parseFloat(profile.da) + parseFloat(profile.ta) + parseFloat(profile.other_allowances)}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('profileDetails').innerHTML = html;
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadPayslips() {
    try {
        const response = await fetch('/api/employee/payslips');
        const payslips = await response.json();
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const html = payslips.map(slip => `
            <div class="border rounded-lg p-6 mb-4 hover:shadow-md transition cursor-pointer" onclick='showPayslipDetails(${JSON.stringify(slip)})'>
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-semibold">${monthNames[slip.month - 1]} ${slip.year}</h3>
                        <p class="text-sm text-gray-600">Net Salary: ₹${slip.net_salary.toFixed(2)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-600">Gross: ₹${slip.gross_salary.toFixed(2)}</p>
                        <p class="text-sm text-gray-600">Deductions: ₹${slip.total_deductions.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('payslipsList').innerHTML = html || '<p class="text-gray-500">No payslips available</p>';
    } catch (error) {
        console.error('Error loading payslips:', error);
    }
}

function showPayslipDetails(slip) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const html = `
        <div class="space-y-4">
            <div class="text-center border-b pb-4">
                <h4 class="text-2xl font-bold">Payslip for ${monthNames[slip.month - 1]} ${slip.year}</h4>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h5 class="font-semibold text-green-700 mb-2">Earnings</h5>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Basic Salary:</span>
                            <span>₹${slip.basic_salary.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>HRA:</span>
                            <span>₹${slip.hra.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>DA:</span>
                            <span>₹${slip.da.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>TA:</span>
                            <span>₹${slip.ta.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Other Allowances:</span>
                            <span>₹${slip.other_allowances.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between font-semibold border-t pt-2">
                            <span>Gross Salary:</span>
                            <span>₹${slip.gross_salary.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h5 class="font-semibold text-red-700 mb-2">Deductions</h5>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>PF:</span>
                            <span>₹${slip.pf_deduction.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Tax:</span>
                            <span>₹${slip.tax_deduction.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Other Deductions:</span>
                            <span>₹${slip.other_deductions.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between font-semibold border-t pt-2">
                            <span>Total Deductions:</span>
                            <span>₹${slip.total_deductions.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <div class="bg-blue-50 p-4 rounded">
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-semibold">Net Salary:</span>
                        <span class="text-2xl font-bold text-blue-600">₹${slip.net_salary.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="text-sm text-gray-600 border-t pt-4">
                <p>Working Days: ${slip.working_days} | Present: ${slip.present_days} | Absent: ${slip.absent_days}</p>
            </div>
        </div>
    `;
    
    document.getElementById('payslipDetails').innerHTML = html;
    document.getElementById('payslipModal').classList.remove('hidden');
}

function hidePayslipModal() {
    document.getElementById('payslipModal').classList.add('hidden');
}

function showApplyLeaveModal() {
    document.getElementById('applyLeaveModal').classList.remove('hidden');
}

function hideApplyLeaveModal() {
    document.getElementById('applyLeaveModal').classList.add('hidden');
    document.getElementById('applyLeaveForm').reset();
}

document.getElementById('applyLeaveForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        leave_type: document.getElementById('leaveType').value,
        start_date: document.getElementById('leaveStartDate').value,
        end_date: document.getElementById('leaveEndDate').value,
        reason: document.getElementById('leaveReason').value
    };
    
    try {
        const response = await fetch('/api/employee/leaves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (result.success) {
            hideApplyLeaveModal();
            loadLeaves();
            alert('Leave application submitted successfully!');
        }
    } catch (error) {
        console.error('Error applying for leave:', error);
        alert('Failed to apply for leave');
    }
});

async function loadLeaves() {
    try {
        const response = await fetch('/api/employee/leaves');
        const leaves = await response.json();
        
        const html = leaves.map(leave => `
            <div class="border-b py-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold capitalize">${leave.leave_type} Leave</h3>
                        <p class="text-sm text-gray-600">${leave.start_date} to ${leave.end_date} (${leave.days} days)</p>
                        <p class="text-sm mt-2">${leave.reason}</p>
                        <p class="text-xs text-gray-500 mt-1">Applied on: ${leave.applied_at}</p>
                    </div>
                    <span class="px-3 py-1 rounded text-sm ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                        leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }">${leave.status}</span>
                </div>
            </div>
        `).join('');
        
        document.getElementById('leavesList').innerHTML = html || '<p class="text-gray-500">No leave applications</p>';
    } catch (error) {
        console.error('Error loading leaves:', error);
    }
}

async function loadAttendance() {
    const month = document.getElementById('attendanceMonth').value;
    const year = document.getElementById('attendanceYear').value;
    
    try {
        const response = await fetch(`/api/employee/attendance?month=${month}&year=${year}`);
        const records = await response.json();
        
        const html = `
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${records.map(rec => `
                        <tr>
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
        
        document.getElementById('attendanceList').innerHTML = html || '<p class="text-gray-500">No attendance records found</p>';
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

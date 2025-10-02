from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from functools import wraps
import pandas as pd

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', 'dev-secret-key-change-in-production')

database_url = os.environ.get('DATABASE_URL')
if not database_url:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Please configure the PostgreSQL database connection."
    )

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin' or 'employee'
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    
    employee = db.relationship('Employee', backref='user_account', uselist=False)

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    department = db.Column(db.String(50))
    designation = db.Column(db.String(50))
    date_of_joining = db.Column(db.Date, nullable=False)
    basic_salary = db.Column(db.Float, nullable=False)
    hra = db.Column(db.Float, default=0)  # House Rent Allowance
    da = db.Column(db.Float, default=0)   # Dearness Allowance
    ta = db.Column(db.Float, default=0)   # Transport Allowance
    other_allowances = db.Column(db.Float, default=0)
    pf_deduction = db.Column(db.Float, default=0)  # Provident Fund
    tax_deduction = db.Column(db.Float, default=0)
    other_deductions = db.Column(db.Float, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    attendance_records = db.relationship('Attendance', backref='employee', lazy=True)
    payroll_records = db.relationship('Payroll', backref='employee', lazy=True)
    leave_records = db.relationship('Leave', backref='employee', lazy=True)

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False)  # 'present', 'absent', 'half-day', 'leave'
    remarks = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Leave(db.Model):
    __tablename__ = 'leaves'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    leave_type = db.Column(db.String(50), nullable=False)  # 'sick', 'casual', 'earned'
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    days = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected'
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

class Payroll(db.Model):
    __tablename__ = 'payroll'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    basic_salary = db.Column(db.Float, nullable=False)
    hra = db.Column(db.Float, default=0)
    da = db.Column(db.Float, default=0)
    ta = db.Column(db.Float, default=0)
    other_allowances = db.Column(db.Float, default=0)
    gross_salary = db.Column(db.Float, nullable=False)
    pf_deduction = db.Column(db.Float, default=0)
    tax_deduction = db.Column(db.Float, default=0)
    other_deductions = db.Column(db.Float, default=0)
    total_deductions = db.Column(db.Float, nullable=False)
    net_salary = db.Column(db.Float, nullable=False)
    working_days = db.Column(db.Integer, default=0)
    present_days = db.Column(db.Integer, default=0)
    absent_days = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='draft')  # 'draft', 'processed', 'paid'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        if session.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        if session.get('role') == 'admin':
            return redirect(url_for('admin_dashboard'))
        else:
            return redirect(url_for('employee_dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        
        if user and check_password_hash(user.password, data['password']):
            session['user_id'] = user.id
            session['username'] = user.username
            session['role'] = user.role
            session['employee_id'] = user.employee_id
            
            return jsonify({
                'success': True,
                'role': user.role,
                'redirect': '/admin' if user.role == 'admin' else '/employee'
            })
        
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/admin')
@admin_required
def admin_dashboard():
    return render_template('admin_dashboard.html')

@app.route('/employee')
@login_required
def employee_dashboard():
    if session.get('role') != 'employee':
        return redirect(url_for('admin_dashboard'))
    return render_template('employee_dashboard.html')

# Admin API Routes
@app.route('/api/admin/employees', methods=['GET', 'POST'])
@admin_required
def manage_employees():
    if request.method == 'POST':
        data = request.get_json()
        
        # Create employee
        employee = Employee(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            department=data['department'],
            designation=data['designation'],
            date_of_joining=datetime.strptime(data['date_of_joining'], '%Y-%m-%d').date(),
            basic_salary=float(data['basic_salary']),
            hra=float(data.get('hra', 0)),
            da=float(data.get('da', 0)),
            ta=float(data.get('ta', 0)),
            other_allowances=float(data.get('other_allowances', 0)),
            pf_deduction=float(data.get('pf_deduction', 0)),
            tax_deduction=float(data.get('tax_deduction', 0)),
            other_deductions=float(data.get('other_deductions', 0))
        )
        db.session.add(employee)
        db.session.commit()
        
        # Create user account if credentials provided
        if 'username' in data and 'password' in data:
            user = User(
                username=data['username'],
                password=generate_password_hash(data['password']),
                role='employee',
                employee_id=employee.id
            )
            db.session.add(user)
            db.session.commit()
        
        return jsonify({'success': True, 'employee_id': employee.id})
    
    # GET - List all employees
    employees = Employee.query.all()
    return jsonify([{
        'id': e.id,
        'name': e.name,
        'email': e.email,
        'phone': e.phone,
        'department': e.department,
        'designation': e.designation,
        'date_of_joining': e.date_of_joining.strftime('%Y-%m-%d'),
        'basic_salary': e.basic_salary,
        'is_active': e.is_active
    } for e in employees])

@app.route('/api/admin/employees/<int:employee_id>', methods=['GET', 'PUT', 'DELETE'])
@admin_required
def employee_detail(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': employee.id,
            'name': employee.name,
            'email': employee.email,
            'phone': employee.phone,
            'department': employee.department,
            'designation': employee.designation,
            'date_of_joining': employee.date_of_joining.strftime('%Y-%m-%d'),
            'basic_salary': employee.basic_salary,
            'hra': employee.hra,
            'da': employee.da,
            'ta': employee.ta,
            'other_allowances': employee.other_allowances,
            'pf_deduction': employee.pf_deduction,
            'tax_deduction': employee.tax_deduction,
            'other_deductions': employee.other_deductions,
            'is_active': employee.is_active
        })
    
    if request.method == 'PUT':
        data = request.get_json()
        employee.name = data.get('name', employee.name)
        employee.email = data.get('email', employee.email)
        employee.phone = data.get('phone', employee.phone)
        employee.department = data.get('department', employee.department)
        employee.designation = data.get('designation', employee.designation)
        employee.basic_salary = float(data.get('basic_salary', employee.basic_salary))
        employee.hra = float(data.get('hra', employee.hra))
        employee.da = float(data.get('da', employee.da))
        employee.ta = float(data.get('ta', employee.ta))
        employee.other_allowances = float(data.get('other_allowances', employee.other_allowances))
        employee.pf_deduction = float(data.get('pf_deduction', employee.pf_deduction))
        employee.tax_deduction = float(data.get('tax_deduction', employee.tax_deduction))
        employee.other_deductions = float(data.get('other_deductions', employee.other_deductions))
        employee.is_active = data.get('is_active', employee.is_active)
        
        db.session.commit()
        return jsonify({'success': True})
    
    if request.method == 'DELETE':
        employee.is_active = False
        db.session.commit()
        return jsonify({'success': True})

@app.route('/api/admin/attendance', methods=['GET', 'POST'])
@admin_required
def manage_attendance():
    if request.method == 'POST':
        data = request.get_json()
        
        # Check if attendance already exists
        existing = Attendance.query.filter_by(
            employee_id=data['employee_id'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date()
        ).first()
        
        if existing:
            existing.status = data['status']
            existing.remarks = data.get('remarks', '')
        else:
            attendance = Attendance(
                employee_id=data['employee_id'],
                date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
                status=data['status'],
                remarks=data.get('remarks', '')
            )
            db.session.add(attendance)
        
        db.session.commit()
        return jsonify({'success': True})
    
    # GET - with filters
    employee_id = request.args.get('employee_id')
    month = request.args.get('month')
    year = request.args.get('year')
    
    query = Attendance.query
    
    if employee_id:
        query = query.filter_by(employee_id=employee_id)
    if month and year:
        start_date = datetime(int(year), int(month), 1).date()
        if int(month) == 12:
            end_date = datetime(int(year) + 1, 1, 1).date()
        else:
            end_date = datetime(int(year), int(month) + 1, 1).date()
        query = query.filter(Attendance.date >= start_date, Attendance.date < end_date)
    
    records = query.order_by(Attendance.date.desc()).all()
    
    return jsonify([{
        'id': a.id,
        'employee_id': a.employee_id,
        'employee_name': a.employee.name,
        'date': a.date.strftime('%Y-%m-%d'),
        'status': a.status,
        'remarks': a.remarks
    } for a in records])

@app.route('/api/admin/leaves', methods=['GET', 'PUT'])
@admin_required
def manage_leaves():
    if request.method == 'PUT':
        data = request.get_json()
        leave = Leave.query.get_or_404(data['leave_id'])
        leave.status = data['status']
        db.session.commit()
        return jsonify({'success': True})
    
    # GET all leave applications
    status = request.args.get('status', 'pending')
    leaves = Leave.query.filter_by(status=status).order_by(Leave.applied_at.desc()).all()
    
    return jsonify([{
        'id': l.id,
        'employee_id': l.employee_id,
        'employee_name': l.employee.name,
        'leave_type': l.leave_type,
        'start_date': l.start_date.strftime('%Y-%m-%d'),
        'end_date': l.end_date.strftime('%Y-%m-%d'),
        'days': l.days,
        'reason': l.reason,
        'status': l.status,
        'applied_at': l.applied_at.strftime('%Y-%m-%d %H:%M')
    } for l in leaves])

@app.route('/api/admin/payroll/process', methods=['POST'])
@admin_required
def process_payroll():
    data = request.get_json()
    month = int(data['month'])
    year = int(data['year'])
    
    employees = Employee.query.filter_by(is_active=True).all()
    processed_count = 0
    
    for employee in employees:
        # Check if payroll already exists
        existing = Payroll.query.filter_by(
            employee_id=employee.id,
            month=month,
            year=year
        ).first()
        
        if existing:
            continue
        
        # Calculate attendance
        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date()
        else:
            end_date = datetime(year, month + 1, 1).date()
        
        working_days = (end_date - start_date).days
        
        attendance_records = Attendance.query.filter(
            Attendance.employee_id == employee.id,
            Attendance.date >= start_date,
            Attendance.date < end_date
        ).all()
        
        present_days = sum(1 for a in attendance_records if a.status in ['present', 'half-day'])
        absent_days = sum(1 for a in attendance_records if a.status == 'absent')
        
        # Calculate salary
        gross_salary = (
            employee.basic_salary +
            employee.hra +
            employee.da +
            employee.ta +
            employee.other_allowances
        )
        
        total_deductions = (
            employee.pf_deduction +
            employee.tax_deduction +
            employee.other_deductions
        )
        
        # Adjust for absences
        per_day_salary = gross_salary / working_days
        absence_deduction = per_day_salary * absent_days
        
        net_salary = gross_salary - total_deductions - absence_deduction
        
        payroll = Payroll(
            employee_id=employee.id,
            month=month,
            year=year,
            basic_salary=employee.basic_salary,
            hra=employee.hra,
            da=employee.da,
            ta=employee.ta,
            other_allowances=employee.other_allowances,
            gross_salary=gross_salary,
            pf_deduction=employee.pf_deduction,
            tax_deduction=employee.tax_deduction,
            other_deductions=employee.other_deductions + absence_deduction,
            total_deductions=total_deductions + absence_deduction,
            net_salary=net_salary,
            working_days=working_days,
            present_days=present_days,
            absent_days=absent_days,
            status='processed'
        )
        
        db.session.add(payroll)
        processed_count += 1
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'processed_count': processed_count,
        'message': f'Payroll processed for {processed_count} employees'
    })

@app.route('/api/admin/payroll', methods=['GET'])
@admin_required
def get_payroll():
    month = request.args.get('month')
    year = request.args.get('year')
    
    query = Payroll.query
    
    if month and year:
        query = query.filter_by(month=int(month), year=int(year))
    
    payrolls = query.order_by(Payroll.created_at.desc()).all()
    
    return jsonify([{
        'id': p.id,
        'employee_id': p.employee_id,
        'employee_name': p.employee.name,
        'month': p.month,
        'year': p.year,
        'gross_salary': p.gross_salary,
        'total_deductions': p.total_deductions,
        'net_salary': p.net_salary,
        'status': p.status
    } for p in payrolls])

@app.route('/api/admin/reports/summary', methods=['GET'])
@admin_required
def payroll_summary():
    month = request.args.get('month')
    year = request.args.get('year')
    
    if not month or not year:
        now = datetime.now()
        month = now.month
        year = now.year
    
    payrolls = Payroll.query.filter_by(month=int(month), year=int(year)).all()
    
    total_gross = sum(p.gross_salary for p in payrolls)
    total_deductions = sum(p.total_deductions for p in payrolls)
    total_net = sum(p.net_salary for p in payrolls)
    
    return jsonify({
        'month': month,
        'year': year,
        'total_employees': len(payrolls),
        'total_gross_salary': total_gross,
        'total_deductions': total_deductions,
        'total_net_salary': total_net
    })

# Employee API Routes
@app.route('/api/employee/profile', methods=['GET'])
@login_required
def employee_profile():
    if session.get('role') != 'employee':
        return jsonify({'error': 'Access denied'}), 403
    
    employee = Employee.query.get_or_404(session['employee_id'])
    
    return jsonify({
        'id': employee.id,
        'name': employee.name,
        'email': employee.email,
        'phone': employee.phone,
        'department': employee.department,
        'designation': employee.designation,
        'date_of_joining': employee.date_of_joining.strftime('%Y-%m-%d'),
        'basic_salary': employee.basic_salary,
        'hra': employee.hra,
        'da': employee.da,
        'ta': employee.ta,
        'other_allowances': employee.other_allowances
    })

@app.route('/api/employee/payslips', methods=['GET'])
@login_required
def employee_payslips():
    if session.get('role') != 'employee':
        return jsonify({'error': 'Access denied'}), 403
    
    payslips = Payroll.query.filter_by(
        employee_id=session['employee_id']
    ).order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    
    return jsonify([{
        'id': p.id,
        'month': p.month,
        'year': p.year,
        'basic_salary': p.basic_salary,
        'hra': p.hra,
        'da': p.da,
        'ta': p.ta,
        'other_allowances': p.other_allowances,
        'gross_salary': p.gross_salary,
        'pf_deduction': p.pf_deduction,
        'tax_deduction': p.tax_deduction,
        'other_deductions': p.other_deductions,
        'total_deductions': p.total_deductions,
        'net_salary': p.net_salary,
        'working_days': p.working_days,
        'present_days': p.present_days,
        'absent_days': p.absent_days,
        'status': p.status
    } for p in payslips])

@app.route('/api/employee/leaves', methods=['GET', 'POST'])
@login_required
def employee_leaves():
    if session.get('role') != 'employee':
        return jsonify({'error': 'Access denied'}), 403
    
    if request.method == 'POST':
        data = request.get_json()
        
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        days = (end_date - start_date).days + 1
        
        leave = Leave(
            employee_id=session['employee_id'],
            leave_type=data['leave_type'],
            start_date=start_date,
            end_date=end_date,
            days=days,
            reason=data.get('reason', ''),
            status='pending'
        )
        
        db.session.add(leave)
        db.session.commit()
        
        return jsonify({'success': True})
    
    # GET
    leaves = Leave.query.filter_by(
        employee_id=session['employee_id']
    ).order_by(Leave.applied_at.desc()).all()
    
    return jsonify([{
        'id': l.id,
        'leave_type': l.leave_type,
        'start_date': l.start_date.strftime('%Y-%m-%d'),
        'end_date': l.end_date.strftime('%Y-%m-%d'),
        'days': l.days,
        'reason': l.reason,
        'status': l.status,
        'applied_at': l.applied_at.strftime('%Y-%m-%d %H:%M')
    } for l in leaves])

@app.route('/api/employee/attendance', methods=['GET'])
@login_required
def employee_attendance():
    if session.get('role') != 'employee':
        return jsonify({'error': 'Access denied'}), 403
    
    month = request.args.get('month')
    year = request.args.get('year')
    
    if not month or not year:
        now = datetime.now()
        month = now.month
        year = now.year
    
    start_date = datetime(int(year), int(month), 1).date()
    if int(month) == 12:
        end_date = datetime(int(year) + 1, 1, 1).date()
    else:
        end_date = datetime(int(year), int(month) + 1, 1).date()
    
    records = Attendance.query.filter(
        Attendance.employee_id == session['employee_id'],
        Attendance.date >= start_date,
        Attendance.date < end_date
    ).order_by(Attendance.date).all()
    
    return jsonify([{
        'date': a.date.strftime('%Y-%m-%d'),
        'status': a.status,
        'remarks': a.remarks
    } for a in records])

# Initialize database
@app.route('/api/init-db', methods=['POST'])
def init_db():
    try:
        db.create_all()
        
        # Create default admin user if not exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                password=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
        
        return jsonify({'success': True, 'message': 'Database initialized successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)

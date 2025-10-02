# Payroll Management System

## Overview
A comprehensive web-based Payroll Management System built with Flask (Python) and PostgreSQL. The system automates employee salary calculations, manages attendance, generates payslips, and maintains financial records with role-based access control.

## Current State
The system is fully functional with the following features implemented:
- Employee and Admin authentication with role-based dashboards
- Employee management (add, update, view)
- Attendance tracking and leave management
- Automated payroll processing with salary calculations
- Payslip generation and viewing
- Salary reports and summaries

## Technology Stack
**Backend:**
- Flask (Python web framework)
- Flask-SQLAlchemy (ORM)
- Flask-CORS (Cross-origin support)
- Werkzeug (Password hashing)
- Pandas (Payroll calculations)
- PostgreSQL (Database)

**Frontend:**
- HTML5
- TailwindCSS (Styling)
- JavaScript (Interactivity)

## Database Schema

### Tables:
1. **users** - Login credentials (username, password, role)
2. **employees** - Employee details (name, email, department, salary structure)
3. **attendance** - Daily attendance records (date, status, remarks)
4. **leaves** - Leave applications (type, dates, status)
5. **payroll** - Monthly salary records (gross, deductions, net salary)

## Key Features

### Admin Dashboard:
- Add/update employee records
- Mark daily attendance
- Approve/reject leave applications
- Process monthly payroll
- Generate salary reports

### Employee Dashboard:
- View personal profile and salary structure
- View monthly payslips
- Apply for leaves
- View attendance records

## Database Setup

### On Replit (Current Environment)
The PostgreSQL database is already configured via the DATABASE_URL environment variable. The database is automatically initialized when the application starts.

To manually initialize the database (if needed):
```bash
curl -X POST http://localhost:5000/api/init-db
```

### For Local Development or Other Environments
1. Copy `.env.example` to `.env`
2. Configure your database URL:
   - For PostgreSQL: `DATABASE_URL=postgresql://user:password@host:port/database`
   - For SQLite (simpler): `DATABASE_URL=sqlite:///payroll.db`
3. Run the application: `python app.py`
4. Initialize the database:
   ```bash
   curl -X POST http://localhost:5000/api/init-db
   ```

This creates all necessary tables and sets up the default admin account.

## Default Credentials
- Admin: username: `admin`, password: `admin123`

## Recent Changes
- September 30, 2025: Initial project setup and complete implementation
- Database initialized with default admin account
- All core payroll features implemented and tested
- PostgreSQL database configured and working

## Project Architecture
- **app.py** - Main Flask application with routes and models
- **templates/** - HTML templates (login, admin_dashboard, employee_dashboard)
- **static/js/** - JavaScript files (admin.js, employee.js)
- **Database** - PostgreSQL database managed via SQLAlchemy ORM

## Data Structures Used
- Hash Table (Dictionary): For quick employee record access
- Queue: For batch payroll processing
- Tree: For hierarchical organization (departments, roles, salary grades)

## Payroll Calculation Logic
- Gross Salary = Basic + HRA + DA + TA + Other Allowances
- Total Deductions = PF + Tax + Other Deductions + Absence Deduction
- Net Salary = Gross Salary - Total Deductions
- Absence deduction calculated as: (Gross Salary / Working Days) × Absent Days

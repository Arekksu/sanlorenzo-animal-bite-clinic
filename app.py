from flask import Flask, render_template, request, redirect, url_for, g, send_file, session, flash
import sqlite3
from datetime import date
import pandas as pd # type: ignore
from io import BytesIO
import json


app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Needed for session
DATABASE = "database.db"

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

def require_login():
    """Helper function to check if user is logged in"""
    if 'employee_id' not in session or 'employee_name' not in session:
        return redirect(url_for('employee_login'))
    return None


def role_required(role):
    """Decorator to require a specific role (e.g., 'admin') for a route."""
    def decorator(f):
        from functools import wraps
        @wraps(f)
        def wrapped(*args, **kwargs):
            if 'role' not in session:
                return redirect(url_for('employee_login'))
            if session.get('role') != role:
                # not authorized for this role
                return redirect(url_for('employee_dashboard'))
            return f(*args, **kwargs)
        return wrapped
    return decorator

##backup to csv
@app.route('/backup-csv')
@role_required('admin')
def backup_csv():
    conn = get_db()  # however you open your SQLite connection
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients")
    rows = cursor.fetchall()

    # Convert sqlite3.Row objects into dicts
    data = [dict(row) for row in rows]

    df = pd.DataFrame(data)
    output = BytesIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return send_file(
        output,
        mimetype="text/csv",
        as_attachment=True,
        download_name="patients_backup.csv"
    )

    
@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/')
def home():
    return redirect(url_for('employee_login'))

@app.route('/logout')
def logout():
    # Log logout for audit trail
    if 'employee_id' in session and 'employee_name' in session:
        log_audit_trail(session['employee_id'], session['employee_name'], "LOGOUT", request.remote_addr)
    
    # Clear the session for audit trail
    session.clear()
    return redirect(url_for('employee_login'))

@app.route('/employee-login', methods=['GET', 'POST'])
def employee_login():
    if request.method == 'POST':
        emp_id = request.form['employeeId']
        password = request.form['password']

        # Employee credentials dictionary
        employees = {
            "admin": {"password": "admin123", "name": "Admin"},
            "doctor1": {"password": "doc123", "name": "Dr. Smith"},
            "nurse1": {"password": "nurse123", "name": "Nurse Johnson"},
            "staff1": {"password": "staff123", "name": "Staff Member"}
        }

        # Check credentials
        if emp_id in employees and employees[emp_id]["password"] == password:
            session['employee_name'] = employees[emp_id]["name"]
            session['employee_id'] = emp_id
            # assign role: admin if emp_id is 'admin', else employee
            session['role'] = 'admin' if emp_id == 'admin' else 'employee'

            # Log successful login for audit trail
            log_audit_trail(emp_id, employees[emp_id]["name"], "LOGIN", request.remote_addr)

            # Instead of immediate redirect, show success notification and client will redirect
            redirect_url = url_for('admin_dashboard') if session['role'] == 'admin' else url_for('employee_dashboard')
            return render_template('employee-login.html', success=True, redirect_url=redirect_url)
        else:
            # Log failed login attempt
            log_audit_trail(emp_id, "Unknown", "FAILED_LOGIN", request.remote_addr)
            return render_template('employee-login.html', error="Invalid credentials")

    return render_template('employee-login.html')


@app.route('/admin-login', methods=['GET', 'POST'])
def admin_login():
    # Simple admin login route (can be expanded to real auth)
    if request.method == 'POST':
        emp_id = request.form['employeeId']
        password = request.form['password']
        # Only allow admin here
        if emp_id == 'admin' and password == 'admin123':
            session['employee_name'] = 'Admin'
            session['employee_id'] = 'admin'
            session['role'] = 'admin'
            log_audit_trail('admin', 'Admin', 'ADMIN_LOGIN', request.remote_addr)
            return redirect(url_for('admin_dashboard'))
        else:
            log_audit_trail(emp_id or 'unknown', 'Unknown', 'FAILED_ADMIN_LOGIN', request.remote_addr)
            return render_template('employee-login.html', error='Invalid admin credentials')

    return render_template('employee-login.html')

@app.route('/employee-dashboard', methods=["GET", "POST"])
def employee_dashboard():
    # Check if user is logged in
    if 'employee_id' not in session or 'employee_name' not in session:
        return redirect(url_for('employee_login'))
    
    conn = get_db()

    # Save patient form
    if request.method == "POST":
        data = (
            request.form['patient_name'],
            request.form['age'],
            request.form['gender'],
            request.form['contact_number'],
            request.form['address'],
            request.form['service_type'],
            request.form['date_of_bite'],
            request.form['bite_location'],
            request.form['place_of_bite'],
            request.form['type_of_bite'],
            request.form['source_of_bite'],
            request.form.get('other_source_of_bite'),
            request.form['source_status'],
            request.form['exposure'],
            request.form['vaccinated'],
            request.form.get('day0'),
            request.form.get('day3'),
            request.form.get('day7'),
            request.form.get('day14'),
            request.form.get('day28'),
        )
        conn.execute("""
            INSERT INTO patients 
            (patient_name, age, gender, contact_number, address, service_type,
            date_of_bite, bite_location, place_of_bite, type_of_bite,
            source_of_bite, other_source_of_bite, source_status, exposure, vaccinated,
            day0, day3, day7, day14, day28)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, data)
        conn.commit()
        return redirect(url_for("employee_dashboard"))

    # Get all patients for display
    patients = conn.execute("""
    SELECT id, patient_name, date_of_bite, service_type, age, gender, contact_number,
           day0, day3, day7, day14, day28
    FROM patients
        """).fetchall()
    # Convert sqlite Row objects to list of dicts so templates and JS can consume JSON safely
    patients_list = [dict(row) for row in patients]

    # Calculate dashboard statistics
    today = date.today().isoformat()
    
    # For upcoming appointments, we'll use patients who have day3, day7, day14, or day28 scheduled
    upcoming_appointments = conn.execute("""
        SELECT COUNT(*) as count FROM patients 
        WHERE day3 >= ? OR day7 >= ? OR day14 >= ? OR day28 >= ?
    """, (today, today, today, today)).fetchone()
    
    # Patients today (based on any scheduled appointment today)
    patients_today = conn.execute("""
        SELECT COUNT(*) as count FROM patients 
        WHERE day0 = ? OR day3 = ? OR day7 = ? OR day14 = ? OR day28 = ?
    """, (today, today, today, today, today)).fetchone()

    return render_template("employee-dashboard.html", 
                         patients=patients_list,
                         patients_json=json.dumps(patients_list),
                         upcoming_appointments=[{'count': upcoming_appointments['count'] if upcoming_appointments else 0}],
                         patients_today=[{'count': patients_today['count'] if patients_today else 0}],
                         employee_name=session.get('employee_name', 'User'),
                         role=session.get('role', 'employee'))


@app.route('/admin-dashboard')
@role_required('admin')
def admin_dashboard():
    # Provide the same data as employee_dashboard but render as admin
    conn = get_db()
    patients = conn.execute("SELECT id, patient_name, date_of_bite, service_type, age, gender, contact_number, day0, day3, day7, day14, day28 FROM patients").fetchall()
    patients_list = [dict(row) for row in patients]
    today = date.today().isoformat()
    upcoming_appointments = conn.execute("SELECT COUNT(*) as count FROM patients WHERE day3 >= ? OR day7 >= ? OR day14 >= ? OR day28 >= ?", (today, today, today, today)).fetchone()
    patients_today = conn.execute("SELECT COUNT(*) as count FROM patients WHERE day0 = ? OR day3 = ? OR day7 = ? OR day14 = ? OR day28 = ?", (today, today, today, today, today)).fetchone()
    return render_template('admin-dashboard.html',
                           patients=patients_list,
                           patients_json=json.dumps(patients_list),
                           upcoming_appointments=[{'count': upcoming_appointments['count'] if upcoming_appointments else 0}],
                           patients_today=[{'count': patients_today['count'] if patients_today else 0}],
                           employee_name=session.get('employee_name', 'Admin'),
                           role='admin')

@app.route("/patient/<int:patient_id>")
def patient_detail(patient_id):
    conn = get_db()
    patient = conn.execute(
        "SELECT * FROM patients WHERE id = ?", (patient_id,)
    ).fetchone()

    if not patient:
        return "Patient not found", 404

    # Convert sqlite3.Row to dict
    patient_dict = dict(patient)

    return patient_dict  # Flask will jsonify this automatically

@app.route("/delete-patient/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    conn = get_db()
    
    # Check if patient exists
    patient = conn.execute(
        "SELECT id FROM patients WHERE id = ?", (patient_id,)
    ).fetchone()
    
    if not patient:
        return "Patient not found", 404
    
    # Delete the patient
    conn.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
    conn.commit()
    
    return {"message": "Patient deleted successfully"}, 200

@app.route("/api/patients")
def api_patients():
    auth_check = require_login()
    if auth_check:
        return auth_check
    
    conn = get_db()
    patients = conn.execute("""
        SELECT id, patient_name, date_of_bite, service_type, age, gender, contact_number,
               day0, day3, day7, day14, day28
        FROM patients
    """).fetchall()
    
    # Convert to list of dictionaries
    patients_list = [dict(patient) for patient in patients]
    
    return {"patients": patients_list}

@app.route("/api/patients-schedule")
def get_patients_schedule():
    auth_check = require_login()
    if auth_check:
        return auth_check
    
    conn = get_db()
    patients = conn.execute("""
        SELECT id, patient_name, service_type, date_of_bite, 
               day0, day3, day7, day14, day28
        FROM patients
    """).fetchall()
    
    # Convert to list of dictionaries
    patients_list = []
    for patient in patients:
        patients_list.append({
            'id': patient['id'],
            'name': patient['patient_name'],
            'service': patient['service_type'],
            'dateBite': patient['date_of_bite'],
            'day0': patient['day0'],
            'day3': patient['day3'],
            'day7': patient['day7'],
            'day14': patient['day14'],
            'day28': patient['day28']
        })
    
    return patients_list

@app.route('/restore-csv', methods=['POST'])
@role_required('admin')
def restore_csv():
    if 'file' not in request.files:
        return redirect(url_for('employee_dashboard'))
    
    file = request.files['file']
    if file.filename == '':
        return redirect(url_for('employee_dashboard'))
    
    if file and file.filename.endswith('.csv'):
        try:
            # Read CSV file
            df = pd.read_csv(file)
            
            # Get database connection
            conn = get_db()
            cursor = conn.cursor()
            
            # Insert each row from CSV into database
            for _, row in df.iterrows():
                cursor.execute("""
                    INSERT OR REPLACE INTO patients (
                        id, patient_name, age, gender, contact_number, address,
                        date_of_bite, bite_location, place_of_bite, source_of_bite,
                        type_of_bite, source_status, exposure, service_type,
                        day0, day3, day7, day14, day28
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    row.get('id'), row.get('patient_name'), row.get('age'), 
                    row.get('gender'), row.get('contact_number'), row.get('address'),
                    row.get('date_of_bite'), row.get('bite_location'), row.get('place_of_bite'),
                    row.get('source_of_bite'), row.get('type_of_bite'), row.get('source_status'),
                    row.get('exposure'), row.get('service_type'), row.get('day0'),
                    row.get('day3'), row.get('day7'), row.get('day14'), row.get('day28')
                ))
            
            conn.commit()
            return redirect(url_for('employee_dashboard'))
            
        except Exception as e:
            print(f"Error restoring CSV: {e}")
            return redirect(url_for('employee_dashboard'))
    
    return redirect(url_for('employee_dashboard'))

@app.route('/db-optimize', methods=['POST'])
@role_required('admin')
def db_optimize():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("VACUUM")
        cursor.execute("ANALYZE")
        conn.commit()
        return redirect(url_for('employee_dashboard'))
    except Exception as e:
        print(f"Error optimizing database: {e}")
        return redirect(url_for('employee_dashboard'))

@app.route('/backup-sqlite')
@role_required('admin')
def backup_sqlite():
    try:
        return send_file(
            DATABASE,
            mimetype="application/x-sqlite3",
            as_attachment=True,
            download_name="database_backup.db"
        )
    except Exception as e:
        print(f"Error backing up database: {e}")
        return redirect(url_for('employee_dashboard'))


#UPDATE PATIENT, EDIT PATIENT ROUTE

@app.route('/update-patient/<int:pid>', methods=['POST'])
@role_required('role')
def update_patient(pid):
    auth_check = require_login()
    if auth_check:
        return auth_check

    db = get_db()
    db.execute("""
        UPDATE patients SET
            patient_name = ?,
            age = ?,
            gender = ?,
            contact_number = ?,
            address = ?,
            service_type = ?,
            date_of_bite = ?,
            bite_location = ?,
            place_of_bite = ?,
            type_of_bite = ?,
            source_of_bite = ?,
            other_source_of_bite = ?,
            source_status = ?,
            exposure = ?,
            vaccinated = ?,
            day0 = ?,
            day3 = ?,
            day7 = ?,
            day14 = ?,
            day28 = ?
        WHERE id = ?
    """, (
        request.form['patient_name'],
        request.form['age'],
        request.form['gender'],
        request.form['contact_number'],
        request.form['address'],
        request.form['service_type'],
        request.form['date_of_bite'],
        request.form['bite_location'],
        request.form['place_of_bite'],
        request.form['type_of_bite'],
        request.form['source_of_bite'],
        request.form.get('other_source_of_bite'),
        request.form['source_status'],
        request.form['exposure'],
        request.form['vaccinated'],
        request.form['day0'],
        request.form['day3'],
        request.form['day7'],
        request.form['day14'],
        request.form['day28'],
        pid
    ))
    db.commit()

    emp_id = session.get('employee_id', 'unknown')
    emp_name = session.get('employee_name', 'unknown')
    log_audit_trail(emp_id, emp_name, f'EDIT patient #{pid}', request.remote_addr)

    flash('Patient record updated successfully!', 'success')
    return redirect(url_for('employee_dashboard'))

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    # Allow employees to update their display name and (client-side) password change request.
    if request.method == 'POST':
        # Read submitted fields
        username = request.form.get('username')
        display_name = request.form.get('display_name')
        # Password fields (note: passwords are not persisted in this simple demo)
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')

        # Update session values so the UI reflects the change immediately.
        if username:
            session['employee_id'] = username
        if display_name:
            session['employee_name'] = display_name

        # Log the account update in the audit trail
        try:
            log_audit_trail(session.get('employee_id', 'unknown'), session.get('employee_name', 'unknown'), 'UPDATE_ACCOUNT', request.remote_addr)
        except Exception:
            pass

        # Note: password change handling would require a persistent user store. Here we accept the form and
        # acknowledge it by returning the settings page with updated session values.
        return redirect(url_for('settings'))

    return render_template('settings.html', role=session.get('role', 'employee'), employee_name=session.get('employee_name'))

@app.route('/audit-trail')
@role_required('admin')
def audit_trail():
    """Get audit trail data for the dashboard"""
    auth_check = require_login()
    if auth_check:
        return auth_check
    
    from flask import jsonify
    conn = get_db()
    audit_logs = conn.execute('''
        SELECT employee_id, employee_name, action, timestamp, ip_address
        FROM audit_trail
        ORDER BY timestamp DESC
        LIMIT 100
    ''').fetchall()
    
    audit_logs = conn.execute('''
        SELECT employee_id, employee_name, action, timestamp, ip_address   
        FROM audit_trail
        ORDER BY timestamp DESC
        LIMIT 100
    ''').fetchall()
    
    return jsonify({'audit_logs': [dict(log) for log in audit_logs]})

def init_database():
    """Initialize database tables including audit trail"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create audit_trail table if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_trail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id TEXT,
            employee_name TEXT,
            action TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

def log_audit_trail(employee_id, employee_name, action, ip_address):
    """Log employee actions for audit trail"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO audit_trail (employee_id, employee_name, action, ip_address)
        VALUES (?, ?, ?, ?)
    ''', (employee_id, employee_name, action, ip_address))
    
    conn.commit()
    conn.close()


if __name__ == "__main__":
    # Initialize database tables
    init_database()
    app.run(debug=True, port=5001)

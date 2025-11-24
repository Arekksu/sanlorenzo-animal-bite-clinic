from flask import Flask, render_template, request, redirect, url_for, g, send_file, session, flash, jsonify
import sqlite3
import bcrypt
from datetime import date, datetime, timezone
import pandas as pd # type: ignore
from io import BytesIO
import json

# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Needed for session
DATABASE = "database.db"

def get_db():
    """Get a database connection with proper row factory."""
    # ALWAYS return a NEW connection - never share via g.db
    conn = sqlite3.connect(DATABASE, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@app.teardown_appcontext
def close_db(error):
    """Clean up any database connections."""
    # Since we're not using g.db anymore, just pass
    pass

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


@app.route('/favicon.ico')
def favicon():
    """Redirect browser requests for /favicon.ico to the clinic logo in static files.
    This prevents 404s when browsers auto-request /favicon.ico.
    """
    return redirect(url_for('static', filename='images/san lorenzo.jpg'))

@app.route('/logout')
def logout():
    # Log logout for audit trail
    if 'employee_id' in session and 'employee_name' in session:
        log_audit_trail(session['employee_id'], session['employee_name'], "LOGOUT", request.remote_addr)
    
    # Clear the session for audit trail
    session.clear()
    return redirect(url_for('employee_login'))

# update schedule

@app.route('/get_employees')
@role_required('admin')
def get_employees():
    try:
        conn = get_db()
        employees = conn.execute('SELECT employee_id, username, name, role, active, last_login FROM employees ORDER BY username != "admin", name').fetchall()
        def to_iso(dt):
            return dt.isoformat() if dt else None
        return jsonify({'success': True, 'employees': [
            {
                'employee_id': emp['employee_id'],
                'username': emp['username'],
                'name': emp['name'],
                'role': emp['role'],
                'active': bool(emp['active']),
                'last_login': emp['last_login']
            } for emp in employees
        ]})
    except Exception as e:
        print(f"Error getting employees: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to retrieve employees'})

# done
@app.route("/patients/<int:patient_id>/schedule-status", methods=["POST"])
def update_schedule_status(patient_id):
    try:
        # kunin JSON body (field + done)
        data = request.get_json(force=True) or {}
        print("Received JSON for schedule-status:", data)

        field = data.get("field")
        done  = data.get("done", 0)

        # i-cast to int (0 or 1)
        try:
            done = int(done)
        except ValueError:
            done = 0

        # safety: only allow specific columns
        allowed = [
            "day0_done", "day3_done", "day7_done", "day14_done", "day28_done",
            "booster1_done", "booster2_done"
        ]
        if field not in allowed:
            print("Invalid field:", field)
            return jsonify(success=False, error="Invalid field"), 400

        # update sa SQLite
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"UPDATE patients SET {field} = ? WHERE id = ?", (done, patient_id))
        conn.commit()

        print("Updated", field, "for patient", patient_id, "=", done)
        return jsonify(success=True), 200

    except Exception as e:
        import traceback
        traceback.print_exc()  # lalabas sa terminal ang tunay na error
        return jsonify(success=False, error=str(e)), 500


@app.route('/get_employee/<int:employee_id>')
@role_required('admin')
def get_employee(employee_id):
    try:
        conn = get_db()
        employee = conn.execute('SELECT employee_id, username, name, role, active, last_login FROM employees WHERE employee_id = ?', (employee_id,)).fetchone()
        if employee:
            return jsonify({'success': True, 'employee': dict(employee)})
        return jsonify({'success': False, 'message': 'Employee not found'})
    except Exception as e:
        print(f"Error getting employee: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to retrieve employee details'})

@app.route('/toggle_employee_status/<int:employee_id>', methods=['POST'])
@role_required('admin')
def toggle_employee_status(employee_id):
    try:
        data = request.get_json()
        new_status = data.get('active', False)
        conn = get_db()
        employee = conn.execute('SELECT username FROM employees WHERE employee_id = ?', (employee_id,)).fetchone()
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'})
        if employee['username'] == 'admin':
            return jsonify({'success': False, 'message': 'Cannot modify admin account status'})
        conn.execute('UPDATE employees SET active = ? WHERE employee_id = ?', (1 if new_status else 0, employee_id))
        conn.commit()
        return jsonify({'success': True, 'message': 'Status updated successfully'})
    except Exception as e:
        print(f"Error updating status: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update status'})

@app.route('/reset_password/<int:employee_id>', methods=['POST'])
@role_required('admin')
def reset_password(employee_id):
    try:
        conn = get_db()
        # Don't allow resetting admin password
        employee = conn.execute('SELECT username FROM employees WHERE employee_id = ?', 
                              (employee_id,)).fetchone()

        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'})

        if employee['username'] == 'admin':
            return jsonify({'success': False, 'message': 'Cannot reset admin password'})

        # Default password will be "password123"
        default_password = "password123"
        hashed = bcrypt.hashpw(default_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        conn.execute('UPDATE employees SET password = ? WHERE employee_id = ?',
                    (hashed, employee_id))
        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Password reset successfully'
        })
    except Exception as e:
        print(f"Error resetting password: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to reset password'})

@app.route('/reset_employee_password/<int:employee_id>', methods=['POST'])
@role_required('admin')
def reset_employee_password(employee_id):
    try:
        conn = get_db()
        # Don't allow resetting admin password
        employee = conn.execute('SELECT username FROM employees WHERE employee_id = ?', 
                              (employee_id,)).fetchone()
        
        if employee and employee['username'] == 'admin':
            return jsonify({
                'success': False,
                'message': 'Cannot reset admin password through this interface'
            })
        
        # Generate a secure temporary password
        import random
        import string
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        hashed_password = bcrypt.hashpw(temp_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn.execute('UPDATE employees SET password = ? WHERE employee_id = ?', 
                    (hashed_password, employee_id))
        conn.commit()
        
        log_audit_trail(
            session['employee_id'],
            session['employee_name'],
            f"Reset password for employee (ID: {employee_id})",
            request.remote_addr
        )
        
        return jsonify({
            'success': True,
            'message': f'Password reset successfully. Temporary password: {temp_password}'
        })
    except Exception as e:
        print(f"Error resetting password: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to reset password'})

@app.route('/create_employee', methods=['POST'])
def create_employee():
    if 'role' not in session or session['role'] != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    try:
        username = request.form.get('username')
        display_name = request.form.get('display_name')
        password = request.form.get('password')
        role = request.form.get('role')

        # Validate required fields
        if not all([username, display_name, password, role]):
            return jsonify({'success': False, 'message': 'All fields are required'})

        # Check if username already exists
        conn = get_db()
        existing_user = conn.execute('SELECT * FROM employees WHERE username = ?', (username,)).fetchone()
        if existing_user:
            return jsonify({'success': False, 'message': 'Username already exists'})

        # Hash the password (type check for safety)
        if not password:
            return jsonify({'success': False, 'message': 'Password is required'})
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insert new employee
        conn.execute('''
            INSERT INTO employees (username, name, password) 
            VALUES (?, ?, ?)
        ''', (username, display_name, hashed_password))
        conn.commit()

        # Log the action
        log_audit_trail(session['employee_id'], session['employee_name'], 
                       f"Created new employee account: {username}", request.remote_addr)

        return jsonify({'success': True, 'message': 'Employee created successfully'})

    except Exception as e:
        print(f"Error creating employee: {str(e)}")
        return jsonify({'success': False, 'message': 'An error occurred while creating the account'})

@app.route('/employee-login', methods=['GET', 'POST'])
def employee_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = get_db()
        try:
            user = conn.execute('SELECT * FROM employees WHERE username = ?', (username,)).fetchone()
            if user and bcrypt.checkpw(password.encode(), user['password'].encode('utf-8')):
                session['employee_name'] = user['name']
                session['employee_id'] = user['employee_id']
                session['role'] = 'admin' if username == 'admin' else 'employee'
                # Save last login timestamp in UTC
                conn.execute('UPDATE employees SET last_login = ? WHERE employee_id = ?',
                             (datetime.now(timezone.utc).isoformat(), user['employee_id']))
                conn.commit()
                log_audit_trail(username, user['name'], "LOGIN", request.remote_addr)
                if session['role'] == 'admin':
                    return redirect(url_for('admin_dashboard'))
                else:
                    return redirect(url_for('employee_dashboard', active_tab='dashboard'))
            else:
                log_audit_trail(username, "Unknown", "FAILED_LOGIN", request.remote_addr)
                return render_template('employee-login.html', error='Invalid credentials')
        finally:
            conn.close()
    return render_template('employee-login.html')

@app.route('/admin-login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = get_db()
        user = conn.execute('SELECT * FROM employees WHERE username = ?', (username,)).fetchone()
        if user and username == 'admin' and bcrypt.checkpw(password.encode(), user['password'].encode('utf-8')):
            session['employee_name'] = user['name']
            session['employee_id'] = user['employee_id']
            session['role'] = 'admin'
            log_audit_trail('admin', user['name'], 'ADMIN_LOGIN', request.remote_addr)
            return redirect(url_for('admin_dashboard'))
        else:
            log_audit_trail(username or 'unknown', 'Unknown', 'FAILED_ADMIN_LOGIN', request.remote_addr)
            return render_template('employee-login.html', error='Invalid admin credentials')
    return render_template('employee-login.html')

@app.route('/employee-dashboard', methods=["GET", "POST"])
def employee_dashboard():
    # Check if user is logged in
    if 'employee_id' not in session or 'employee_name' not in session:
        return redirect(url_for('employee_login'))
    
    # Initialize active_tab as dashboard unless specified
    active_tab = request.args.get('active_tab', 'dashboard')
    conn = get_db()
    
    try:
        # Save patient form
        if request.method == "POST":
            data = (
                # Personal
                request.form['patient_name'],
                request.form['age'],
                request.form['gender'],
                request.form['contact_number'],
                request.form['address'],
                request.form.get('weight'),
                request.form.get('medical_history_allergies'),
                request.form.get('medication'),
                request.form.get('consent'),

                # Service / vaccine
                request.form['service_type'],
                request.form.get('route_of_vaccine'),
                request.form.get('route_im_consent'),
                request.form.get('booster1'),
                request.form.get('booster2'),

                # Bite details
                request.form.get('date_of_bite'),
                request.form.get('bite_location'),
                request.form.get('place_of_bite'),
                request.form.get('type_of_bite'),
                request.form.get('bite_category'),

                # Animal info
                request.form.get('source_of_bite'),
                request.form.get('other_source_of_bite'),
                request.form.get('source_status'),
                request.form.get('exposure'),
                request.form.get('type_of_exposure'),

                # Extra / tetanus
                request.form.get('additional_remarks'),
                request.form.get('tt1'),
                request.form.get('tt6'),
                request.form.get('tt30'),
                request.form.get('anti_tetanus'),

                # Rabies vacc history
                request.form['vaccinated'],

                # Schedule
                request.form.get('day0'),
                request.form.get('day3'),
                request.form.get('day7'),
                request.form.get('day14'),
                request.form.get('day28'),
            )

            conn.execute("""
            INSERT INTO patients (
                patient_name, age, gender, contact_number, address,
                weight, medical_history_allergies, medication, consent,
                service_type, route_of_vaccine, route_im_consent,
                booster1, booster2,
                date_of_bite, bite_location, place_of_bite,
                type_of_bite, bite_category,
                source_of_bite, other_source_of_bite, source_status,
                exposure, type_of_exposure,
                additional_remarks, tt1, tt6, tt30, anti_tetanus,
                vaccinated,
                day0, day3, day7, day14, day28
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?,
                ?, ?, ?,
                ?, ?,
                ?, ?, ?,
                ?, ?,
                ?, ?, ?, ?, ?,
                ?,
                ?, ?, ?, ?, ?
            )
        """, data)
            conn.commit()
            
            # Log to audit trail
            log_audit_trail(
                session['employee_id'],
                session['employee_name'],
                f"Added new patient record: {request.form['patient_name']}",
                request.remote_addr
            )
            
            flash('Record added successfully!', 'success')
            if session.get('role') == 'admin':
                return redirect(url_for('admin_dashboard'))
            else:
                return redirect(url_for('employee_dashboard'))


        # Get all patients for display
        patients = conn.execute("""
            SELECT
                id, patient_name, age, gender, contact_number, address,
                weight, medical_history_allergies, medication, consent,
                service_type, route_of_vaccine, route_im_consent,
                booster1, booster2,
                date_of_bite, bite_location, place_of_bite,
                type_of_bite, bite_category,
                source_of_bite, other_source_of_bite, source_status,
                exposure, type_of_exposure,
                additional_remarks, tt1, tt6, tt30, anti_tetanus,
                vaccinated,
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

        employee_id = session.get('employee_id')
        user = conn.execute('SELECT * FROM employees WHERE employee_id = ?', (employee_id,)).fetchone()
        return render_template("employee-dashboard.html", 
                             patients=patients_list,
                             patients_json=json.dumps(patients_list, default=str),
                             upcoming_appointments=[{'count': upcoming_appointments['count'] if upcoming_appointments else 0}],
                             patients_today=[{'count': patients_today['count'] if patients_today else 0}],
                             employee_name=session.get('employee_name', 'User'),
                             role=session.get('role', 'employee'),
                             user=user)
    finally:
        conn.close()


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
                           patients_json=json.dumps(patients_list, default=str),
                           upcoming_appointments=[{'count': upcoming_appointments['count'] if upcoming_appointments else 0}],
                           patients_today=[{'count': patients_today['count'] if patients_today else 0}],
                           employee_name=session.get('employee_name', 'Admin'),
                           role='admin')

@app.route("/patient/<int:patient_id>")
def patient_detail(patient_id):
    try:
        conn = get_db()
        patient = conn.execute("""
            SELECT
                id, patient_name, age, gender, contact_number, address,
                weight, medical_history_allergies, medication, consent,
                service_type, route_of_vaccine, route_im_consent,
                booster1, booster2,
                date_of_bite, bite_location, place_of_bite,
                type_of_bite, bite_category,
                source_of_bite, other_source_of_bite, source_status,
                exposure, type_of_exposure,
                additional_remarks, tt1, tt6, tt30, anti_tetanus,
                vaccinated, erig_refusal,
                day0, day3, day7, day14, day28
            FROM patients
            WHERE id = ?
        """, (patient_id,)).fetchone()

        if patient is None:
            # klarong JSON ang balik, hindi plain text
            return jsonify({"ok": False, "error": "not_found"}), 404

        # Return the patient object directly so frontend fetches get a plain patient dict
        return jsonify(dict(patient))

    except Exception as e:
        # makikita  yung real error sa terminal/logs
        app.logger.exception(f"Error loading patient {patient_id}")
        return jsonify({
            "ok": False,
            "error": "server_error",
            "message": str(e)
        }), 500

# DAY DONE

@app.route("/delete-patient/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    if 'employee_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db()
    
    # Get patient info before deleting for audit log
    patient = conn.execute(
        "SELECT patient_name FROM patients WHERE id = ?", (patient_id,)
    ).fetchone()
    
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    
    patient_name = patient['patient_name']
    
    # Delete the patient
    conn.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
    conn.commit()
    
    # Log to audit trail
    log_audit_trail(
        session['employee_id'],
        session['employee_name'],
        f"Deleted patient record: {patient_name} (ID: {patient_id})",
        request.remote_addr
    )
    
    return jsonify({"message": "Patient deleted successfully"}), 200

@app.route("/api/patients")
def api_patients():
    auth_check = require_login()
    if auth_check:
        return auth_check

    conn = get_db()
    patients = conn.execute("""
    SELECT
        id, patient_name, age, gender, contact_number, address,
        weight, medical_history_allergies, medication, consent,
        service_type, route_of_vaccine, route_im_consent,
        booster1, booster2,
        date_of_bite, bite_location, place_of_bite,
        type_of_bite, bite_category,
        source_of_bite, other_source_of_bite, source_status,
        exposure, type_of_exposure,
        additional_remarks, tt1, tt6, tt30, anti_tetanus,
        vaccinated,
        day0, day3, day7, day14, day28
    FROM patients
    """).fetchall()

    # Convert to list of dictionaries and return JSON serializable object
    patients_list = [dict(p) for p in patients]
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

@app.route('/mark-appointment-done', methods=['POST'])
def mark_appointment_done():
    """Mark an appointment as completed"""
    if 'employee_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        patient_id = data.get('patient_id')
        appointment_day = data.get('day')  # e.g., 'day0', 'day3', etc.
        appointment_date = data.get('date')
        
        conn = get_db()
        patient = conn.execute(
            "SELECT patient_name FROM patients WHERE id = ?", 
            (patient_id,)
        ).fetchone()
        
        if not patient:
            return jsonify({'success': False, 'error': 'Patient not found'}), 404
        
        # Log to audit trail
        log_audit_trail(
            session['employee_id'],
            session['employee_name'],
            f"Marked appointment as DONE for {patient['patient_name']} - {appointment_day} ({appointment_date})",
            request.remote_addr
        )
        
        return jsonify({'success': True, 'message': 'Appointment marked as done'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/mark-appointment-noshow', methods=['POST'])
def mark_appointment_noshow():
    """Mark an appointment as no-show"""
    if 'employee_id' not in session:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        patient_id = data.get('patient_id')
        appointment_day = data.get('day')
        appointment_date = data.get('date')
        
        conn = get_db()
        patient = conn.execute(
            "SELECT patient_name FROM patients WHERE id = ?", 
            (patient_id,)
        ).fetchone()
        
        if not patient:
            return jsonify({'success': False, 'error': 'Patient not found'}), 404
        
        # Log to audit trail
        log_audit_trail(
            session['employee_id'],
            session['employee_name'],
            f"Marked appointment as NO-SHOW for {patient['patient_name']} - {appointment_day} ({appointment_date})",
            request.remote_addr
        )
        
        return jsonify({'success': True, 'message': 'Appointment marked as no-show'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/restore-csv', methods=['POST'])
@role_required('admin')
def restore_csv():
    if 'file' not in request.files:
        return redirect(url_for('employee_dashboard'))
    
    file = request.files['file']
    if not file.filename or file.filename == '':
        return redirect(url_for('employee_dashboard'))
    
    if file and file.filename.endswith('.csv'):
        try:
            # Read CSV file - type: ignore for FileStorage compatibility
            df = pd.read_csv(file)  # type: ignore[arg-type]
            
            # Get database connection
            conn = get_db()
            cursor = conn.cursor()
            
            # Insert each row from CSV into database
            for _, row in df.iterrows():
                cursor.execute("""
    INSERT OR REPLACE INTO patients (
        id, patient_name, age, gender, contact_number, address,
        weight, medical_history_allergies, medication, consent,
        service_type, route_of_vaccine, route_im_consent,
        booster1, booster2,
        date_of_bite, bite_location, place_of_bite,
        type_of_bite, bite_category,
        source_of_bite, other_source_of_bite, source_status,
        exposure, type_of_exposure,
        additional_remarks, tt1, tt6, tt30, anti_tetanus,
        vaccinated,
        day0, day3, day7, day14, day28
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row.get('id'),
            row.get('patient_name'),
            row.get('age'),
            row.get('gender'),
            row.get('contact_number'),
            row.get('address'),
            row.get('weight'),
            row.get('medical_history_allergies'),
            row.get('medication'),
            row.get('consent'),
            row.get('service_type'),
            row.get('route_of_vaccine'),
            row.get('route_im_consent'),
            row.get('booster1'),
            row.get('booster2'),
            row.get('date_of_bite'),
            row.get('bite_location'),
            row.get('place_of_bite'),
            row.get('type_of_bite'),
            row.get('bite_category'),
            row.get('source_of_bite'),
            row.get('other_source_of_bite'),
            row.get('source_status'),
            row.get('exposure'),
            row.get('type_of_exposure'),
            row.get('additional_remarks'),
            row.get('tt1'),
            row.get('tt6'),
            row.get('tt30'),
            row.get('anti_tetanus'),
            row.get('vaccinated'),
            row.get('day0'),
            row.get('day3'),
            row.get('day7'),
            row.get('day14'),
            row.get('day28'),
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
def update_patient(pid):
    auth_check = require_login()
    if auth_check: return auth_check

    # Accept both form posts and JSON posts
    payload = request.form.to_dict()
    if not payload:  # probably JSON
        payload = request.get_json(silent=True) or {}

    # Optional: fail fast if required field missing
    if not payload.get('patient_name'):
        return ("Missing 'patient_name' in request. "
                "Send as form fields or JSON with matching keys."), 400

    fields = [
    'patient_name', 'age', 'gender', 'contact_number', 'address',
    'weight', 'medical_history_allergies', 'medication', 'consent',
    'service_type', 'route_of_vaccine', 'route_im_consent',
    'booster1', 'booster2',
    'date_of_bite', 'bite_location', 'place_of_bite',
    'type_of_bite', 'bite_category',
    'source_of_bite', 'other_source_of_bite', 'source_status',
    'exposure', 'type_of_exposure',
    'additional_remarks', 'tt1', 'tt6', 'tt30', 'anti_tetanus',
    'vaccinated',
    'day0', 'day3', 'day7', 'day14', 'day28'
    ]
    vals = [payload.get(f) for f in fields]


    # Use direct connection instead of shared g.db
    conn = sqlite3.connect(DATABASE, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute('BEGIN')
        conn.execute("""
            UPDATE patients SET
              patient_name=?, age=?, gender=?, contact_number=?, address=?,
              weight=?, medical_history_allergies=?, medication=?, consent=?,
              service_type=?, route_of_vaccine=?, route_im_consent=?,
              booster1=?, booster2=?,
              date_of_bite=?, bite_location=?, place_of_bite=?,
              type_of_bite=?, bite_category=?,
              source_of_bite=?, other_source_of_bite=?, source_status=?,
              exposure=?, type_of_exposure=?,
              additional_remarks=?, tt1=?, tt6=?, tt30=?, anti_tetanus=?,
              vaccinated=?,
              day0=?, day3=?, day7=?, day14=?, day28=?
            WHERE id=?
        """, [*vals, pid])

        conn.commit()
        
        # Log to audit trail
        log_audit_trail(
            session['employee_id'],
            session['employee_name'],
            f"Updated patient record: {payload.get('patient_name')} (ID: {pid})",
            request.remote_addr
        )
        
    finally:
        conn.close()
    return redirect(url_for('employee_dashboard'))



@app.route('/settings', methods=['GET', 'POST'])
def settings():
    """Handle user settings updates"""
    error = None
    success = None
    employee_id = session.get('employee_id')
    
    if not employee_id:
        return redirect(url_for('employee_login'))
    
    # Create a fresh connection - DEFERRED mode to avoid locks
    conn = sqlite3.connect(DATABASE, timeout=30.0, isolation_level='DEFERRED')
    conn.row_factory = sqlite3.Row
    
    try:
        # Get current user info
        user = conn.execute(
            'SELECT * FROM employees WHERE employee_id = ?', 
            (employee_id,)
        ).fetchone()
        
        if not user:
            conn.close()
            return redirect(url_for('employee_login'))
        
        if request.method == 'POST':
            import bcrypt
            
            messages = []  # Store all messages
            
            username = request.form.get('username', '').strip()
            display_name = request.form.get('display_name', '').strip()
            current_password = request.form.get('current_password', '')
            new_password = request.form.get('new_password', '')
            confirm_password = request.form.get('confirm_password', '')
            
            # Update username if changed
            if username and username != user['username']:
                # Check if username already exists
                existing = conn.execute(
                    'SELECT employee_id FROM employees WHERE username = ? AND employee_id != ?',
                    (username, employee_id)
                ).fetchone()
                
                if existing:
                    messages.append(('error', 'Username already taken. Please choose another.'))
                else:
                    try:
                        conn.execute('UPDATE employees SET username = ? WHERE employee_id = ?', 
                                  (username, employee_id))
                        conn.commit()
                        messages.append(('success', 'Username updated successfully!'))
                        
                        # Log the username change to audit trail
                        conn.execute("""
                            INSERT INTO audit_trail (employee_id, employee_name, action, timestamp, ip_address)
                            VALUES (?, ?, ?, ?, ?)
                        """, (
                            employee_id,
                            session['employee_name'],
                            f'Changed username to: {username}',
                            datetime.now().isoformat(),
                            request.remote_addr
                        ))
                        conn.commit()
                        
                        # Refresh user data
                        user = conn.execute(
                            'SELECT * FROM employees WHERE employee_id = ?', 
                            (employee_id,)
                        ).fetchone()
                    except Exception as e:
                        conn.rollback()
                        messages.append(('error', f'Error updating username: {str(e)}'))
            
            # Update display name if changed
            if display_name and display_name != user['name']:
                try:
                    conn.execute('UPDATE employees SET name = ? WHERE employee_id = ?', 
                              (display_name, employee_id))
                    conn.commit()
                    
                    # Log the display name change to audit trail
                    conn.execute("""
                        INSERT INTO audit_trail (employee_id, employee_name, action, timestamp, ip_address)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        employee_id,
                        session['employee_name'],
                        f'Changed display name to: {display_name}',
                        datetime.now().isoformat(),
                        request.remote_addr
                    ))
                    conn.commit()
                    
                    session['employee_name'] = display_name
                    messages.append(('success', 'Display name updated successfully!'))
                    
                    # Refresh user data
                    user = conn.execute(
                        'SELECT * FROM employees WHERE employee_id = ?', 
                        (employee_id,)
                    ).fetchone()
                except Exception as e:
                    conn.rollback()
                    messages.append(('error', f'Error updating display name: {str(e)}'))
            
            # Update password if provided
            if new_password:
                if not current_password:
                    messages.append(('error', 'Current password is required to change password.'))
                elif not bcrypt.checkpw(current_password.encode(), user['password'].encode('utf-8')):
                    messages.append(('error', 'Current password is incorrect.'))
                elif new_password != confirm_password:
                    messages.append(('error', 'New passwords do not match.'))
                else:
                    try:
                        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode('utf-8')
                        conn.execute('UPDATE employees SET password = ? WHERE employee_id = ?', 
                                 (hashed, employee_id))
                        conn.commit()
                        
                        # Log the password change to audit trail
                        conn.execute("""
                            INSERT INTO audit_trail (employee_id, employee_name, action, timestamp, ip_address)
                            VALUES (?, ?, ?, ?, ?)
                        """, (
                            employee_id,
                            session['employee_name'],
                            'Changed account password',
                            datetime.now().isoformat(),
                            request.remote_addr
                        ))
                        conn.commit()
                        messages.append(('success', 'Password updated successfully!'))
                    except Exception as e:
                        conn.rollback()
                        messages.append(('error', f'Error updating password: {str(e)}'))
            
            # Return with messages
            return render_template('employee-dashboard.html',
                                role=session.get('role', 'employee'),
                                employee_name=session.get('employee_name'),
                                user=user,
                                active_tab='settings',
                                patients_json=[],
                                toast_messages=messages)
        
    finally:
        # Always close the connection
        conn.close()
    
    return render_template('employee-dashboard.html',
                        role=session.get('role', 'employee'),
                        employee_name=session.get('employee_name'),
                        user=user,
                        active_tab='settings',
                        patients_json=[],
                        toast_messages=[])


@app.route('/audit-trail')
@role_required('admin')
def audit_trail():
    """Get audit trail data for the dashboard"""
    auth_check = require_login()
    if auth_check:
        return auth_check
    
    conn = get_db()
    try:
        audit_logs = conn.execute('''
            SELECT employee_id, employee_name, action, timestamp, ip_address
            FROM audit_trail
            ORDER BY timestamp DESC
        ''').fetchall()
        return jsonify([dict(row) for row in audit_logs])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        try:
            conn.rollback()
        except:
            pass


def log_audit_trail(employee_id, employee_name, action, ip_address):
    """Log employee actions for audit trail"""
    conn = None
    try:
        conn = get_db()
        conn.execute('BEGIN IMMEDIATE')
        conn.execute('''
            INSERT INTO audit_trail (employee_id, employee_name, action, ip_address)
            VALUES (?, ?, ?, ?)
        ''', (employee_id, employee_name, action, ip_address))
        conn.execute('COMMIT')
    except Exception as e:
        if conn:
            try:
                conn.execute('ROLLBACK')
            except:
                pass
        # Only raise non-locking errors
        if not isinstance(e, sqlite3.OperationalError) or 'database is locked' not in str(e):
            raise


if __name__ == "__main__":
    app.run(debug=True, port=5001)

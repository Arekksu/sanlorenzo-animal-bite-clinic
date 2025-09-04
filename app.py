from flask import Flask, render_template, request, redirect, url_for, g
import sqlite3
from datetime import date


app = Flask(__name__)
DATABASE = "database.db"

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/')
def home():
    return "Welcome to the Animal Bite Clinic System"

@app.route('/employee-login', methods=['GET', 'POST'])
def employee_login():
    if request.method == 'POST':
        emp_id = request.form['employeeId']
        password = request.form['password']

        # Demo credentials
        if emp_id == "admin" and password == "admin123":
            return redirect(url_for('employee_dashboard'))
        else:
            return render_template('employee-login.html', error="Invalid credentials")

    return render_template('employee-login.html')

@app.route('/employee-dashboard', methods=["GET", "POST"])
def employee_dashboard():
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
                         patients=patients,
                         upcoming_appointments=[{'count': upcoming_appointments['count'] if upcoming_appointments else 0}],
                         patients_today=[{'count': patients_today['count'] if patients_today else 0}])

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


if __name__ == "__main__":
    app.run(debug=True, port=5001)

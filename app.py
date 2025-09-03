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
    SELECT id, patient_name, date_of_bite, service_type, age, gender, contact_number
    FROM patients
        """).fetchall()

    # Get statistics for dashboard
    upcoming_appointments = []  # You can implement this based on your schedule logic
    patients_today = conn.execute("""
    SELECT * FROM patients WHERE date_of_bite = ?
    """, (date.today(),)).fetchall()

    return render_template("employee-dashboard.html", 
                         patients=patients, 
                         upcoming_appointments=upcoming_appointments,
                         patients_today=patients_today)

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

@app.route("/edit-patient/<int:patient_id>", methods=["POST"])
def edit_patient(patient_id):
    conn = get_db()
    
    print(f"Editing patient {patient_id}")
    print(f"Form data: {dict(request.form)}")
    
    # Update patient data with all fields
    data = (
        request.form['patient_name'],
        request.form['age'],
        request.form['gender'],
        request.form['contact_number'],
        request.form['address'],
        request.form['service_type'],
        request.form['date_of_bite'],
        request.form['bite_location'],
        request.form.get('place_of_bite'),
        request.form.get('type_of_bite'),
        request.form.get('source_of_bite'),
        request.form.get('source_status'),
        request.form.get('exposure'),
        request.form.get('vaccinated'),
        patient_id
    )
    
    try:
        conn.execute("""
            UPDATE patients 
            SET patient_name = ?, age = ?, gender = ?, contact_number = ?, 
                address = ?, service_type = ?, date_of_bite = ?, bite_location = ?,
                place_of_bite = ?, type_of_bite = ?, source_of_bite = ?, 
                source_status = ?, exposure = ?, vaccinated = ?
            WHERE id = ?
        """, data)
        conn.commit()
        print(f"Successfully updated patient {patient_id}")
    except Exception as e:
        print(f"Error updating patient: {e}")
        conn.rollback()
    
    return redirect(url_for("employee_dashboard"))

@app.route("/delete-patient/<int:patient_id>", methods=["POST"])
def delete_patient(patient_id):
    conn = get_db()
    
    # Delete patient
    conn.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
    conn.commit()
    
    return "Patient deleted successfully", 200


if __name__ == "__main__":
    app.run(debug=True, port=5001)

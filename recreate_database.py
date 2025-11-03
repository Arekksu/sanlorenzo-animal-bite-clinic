import sqlite3
import bcrypt
import os

# Delete old database if exists
try:
    if os.path.exists('database.db'):
        os.remove('database.db')
        print("✓ Old database deleted")
except:
    print("⚠ Could not delete old database (file in use), will overwrite...")

# Create new database
conn = sqlite3.connect('database.db', timeout=30.0)
conn.execute('PRAGMA journal_mode=DELETE')  # Use DELETE mode instead of WAL
print("✓ New database created/opened")

# Create tables
conn.execute('DROP TABLE IF EXISTS employees')
conn.execute('DROP TABLE IF EXISTS patients')
conn.execute('DROP TABLE IF EXISTS audit_trail')
print("✓ Old tables dropped")

# Create employees table
conn.execute('''
    CREATE TABLE employees (
        employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'employee',
        active INTEGER DEFAULT 0,
        last_login TEXT DEFAULT NULL
    )
''')

# Create default admin account
print("✓ Employees table created")

# Create admin account
admin_password = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Drop everything and recreate
conn.execute('DELETE FROM employees')
conn.execute('INSERT INTO employees (username, password, name, role, active) VALUES (?, ?, ?, ?, ?)',
            ('admin', admin_password, 'Administrator', 'admin', 1))
conn.commit()
print("✓ Employees table created")
print("✓ Default admin account created")

# Create patients table

# Create patients table
conn.execute('''
    CREATE TABLE patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        contact_number TEXT,
        address TEXT,
        service_type TEXT,
        date_of_bite TEXT,
        bite_location TEXT,
        place_of_bite TEXT,
        type_of_bite TEXT,
        source_of_bite TEXT,
        other_source_of_bite TEXT,
        source_status TEXT,
        exposure TEXT,
        vaccinated TEXT,
        day0 TEXT,
        day3 TEXT,
        day7 TEXT,
        day14 TEXT,
        day28 TEXT
    )
''')
print("✓ Patients table created")

# Create audit_trail table
conn.execute('''
    CREATE TABLE audit_trail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT,
        employee_name TEXT,
        action TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT
    )
''')
print("✓ Audit trail table created")

# Commit all changes
conn.commit()
conn.close()

print("\n✅ Database recreated successfully!")
print("✓ Default accounts created:")
print("  - admin / admin")
print("\n   You can now start the app with: python app.py")

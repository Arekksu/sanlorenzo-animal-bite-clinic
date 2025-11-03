import sqlite3

conn = sqlite3.connect('database.db')
conn.row_factory = sqlite3.Row

print("=== EMPLOYEES TABLE ===")
employees = conn.execute('SELECT employee_id, username, name, role FROM employees').fetchall()
for emp in employees:
    print(f"ID: {emp['employee_id']}, Username: {emp['username']}, Name: {emp['name']}, Role: {emp['role']}")

print("\n=== AUDIT TRAIL (Last 10) ===")
audits = conn.execute('SELECT * FROM audit_trail ORDER BY timestamp DESC LIMIT 10').fetchall()
for audit in audits:
    print(f"{audit['timestamp']} - {audit['employee_name']} ({audit['employee_id']}): {audit['action']} from {audit['ip_address']}")

conn.close()

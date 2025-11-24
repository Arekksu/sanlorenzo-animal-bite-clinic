import sqlite3

DATABASE = "database.db"

conn = sqlite3.connect(DATABASE)
cur = conn.cursor()

# 1st batch: kung hindi mo pa nagawa
cur.execute("ALTER TABLE patients ADD COLUMN erig_refusal TEXT")

conn.commit()
conn.close()

print("All new columns added to patients table.")



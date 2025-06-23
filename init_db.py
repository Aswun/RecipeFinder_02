import sqlite3

conn = sqlite3.connect("users.sqlite")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    roles TEXT NOT NULL
)
""")

# Optional: insert dummy data only if table empty
cursor.execute("SELECT COUNT(*) FROM users")
count = cursor.fetchone()[0]

if count == 0:
    cursor.executemany("INSERT INTO users (name, password, roles) VALUES (?, ?, ?)", [
        ("alice", "password123", "admin"),
        ("bob", "123456", "user"),
        ("charlie", "pass123", "moderator")
    ])

conn.commit()
conn.close()

import sqlite3

# Connect to database
connection = sqlite3.connect("database.db")

# Enable foreign key support
connection.execute("PRAGMA foreign_keys = ON;")

cursor = connection.cursor()

# =========================
# CREATE USERS TABLE
# =========================
cursor.execute("""
CREATE TABLE IF NOT EXISTS users(
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
""")

# =========================
# CREATE TASKS TABLE
# =========================
cursor.execute("""
CREATE TABLE IF NOT EXISTS tasks(
    task_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('Low','Medium','High')) DEFAULT 'Low',
    status TEXT CHECK(status IN ('Pending','In Progress','Completed')) DEFAULT 'Pending',
    deadline TEXT,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
)
""")

connection.commit()
connection.close()
print("Database created successfully")
from flask import Flask, request, jsonify, render_template
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow frontend JS to call API

# ======================
# DATABASE CONNECTION
# ======================
def connectDatabase():
    connection = sqlite3.connect("database.db")
    connection.row_factory = sqlite3.Row
    return connection

# ======================
# PAGE ROUTES
# ======================
@app.route("/")
def home():
    return render_template("login.html")

@app.route("/signup")
def signup_page():
    return render_template("signup.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

# ======================
# AUTHENTICATION
# ======================
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = generate_password_hash(data.get('password'))

    connection = connectDatabase()
    cursor = connection.cursor()

    try:
        cursor.execute("""
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        """, (name, email, password))
        connection.commit()
    except sqlite3.IntegrityError:
        connection.close()
        return jsonify({"message": "Email already exists"}), 400

    connection.close()
    return jsonify({"message": "User registered successfully"})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    connection = connectDatabase()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    connection.close()

    if user and check_password_hash(user["password"], password):
        return jsonify({
            "message": "Login successful",
            "user_id": user["user_id"]
        })
    else:
        return jsonify({"message": "Invalid credentials"}), 401

# ======================
# TASK MANAGEMENT
# ======================
@app.route('/create-task', methods=['POST'])
def create_task():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    priority = data.get('priority')
    deadline = data.get('deadline')
    user_id = data.get('user_id')

    connection = connectDatabase()
    cursor = connection.cursor()
    cursor.execute("""
        INSERT INTO tasks (title, description, priority, status, deadline, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (title, description, priority, "Pending", deadline, user_id))
    connection.commit()
    connection.close()

    return jsonify({"message": "Task created successfully"})

@app.route("/update-task/<int:task_id>", methods=['PUT'])
def updateTask(task_id):
    data = request.get_json()

    # Allow partial updates (important for drag-and-drop)
    title = data.get('title')
    description = data.get('description')
    priority = data.get('priority')
    status = data.get('status')
    deadline = data.get('deadline')

    connection = connectDatabase()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE tasks
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            priority = COALESCE(?, priority),
            status = COALESCE(?, status),
            deadline = COALESCE(?, deadline)
        WHERE task_id = ?
    """, (title, description, priority, status, deadline, task_id))

    connection.commit()
    connection.close()

    return jsonify({"message": "Task updated successfully"})

@app.route("/update-status/<int:task_id>", methods=['PUT'])
def update_status(task_id):
    data = request.get_json()
    status = data.get("status")

    connection = connectDatabase()
    cursor = connection.cursor()
    cursor.execute("UPDATE tasks SET status=? WHERE task_id=?", (status, task_id))
    connection.commit()
    connection.close()

    return jsonify({"message": "Task status updated"})

@app.route('/delete-task/<int:task_id>', methods=['DELETE'])
def deleteTask(task_id):
    connection = connectDatabase()
    cursor = connection.cursor()
    cursor.execute("DELETE FROM tasks WHERE task_id = ?", (task_id,))
    connection.commit()
    connection.close()
    return jsonify({"message": "Task deleted successfully"})

@app.route("/viewtask/<int:user_id>", methods=['GET'])
def viewTask(user_id):
    connection = connectDatabase()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM tasks WHERE user_id=?", (user_id,))
    tasks = cursor.fetchall()
    connection.close()

    tasklist = []
    for task in tasks:
        tasklist.append({
            "task_id": task["task_id"],
            "title": task["title"],
            "description": task["description"],
            "priority": task["priority"],
            "status": task["status"],
            "deadline": task["deadline"],
            "user_id": task["user_id"]
        })

    return jsonify(tasklist)

# ======================
# RUN SERVER
# ======================
if __name__ == "__main__":
    app.run(debug=True)

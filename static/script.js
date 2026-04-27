const API_URL = "http://127.0.0.1:5000";

// =========================
// MODAL CONTROL
// =========================
function openForm() {
  document.getElementById("taskModal").style.display = "block";
}
function closeForm() {
  document.getElementById("taskModal").style.display = "none";
}
function closeEdit() {
  document.getElementById("editModal").style.display = "none";
}

// =========================
// CREATE TASK
// =========================
function createTask() {
  const user_id = localStorage.getItem("user_id");

  fetch(API_URL + "/create-task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      priority: document.getElementById("priority").value,
      deadline: document.getElementById("deadline").value,
      user_id: user_id
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      closeForm();
      loadTasks();
    });
}

// =========================
// LOAD TASKS
// =========================
let currentFilter = "All";

function filterTasks(event) {
  document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("active"));
  const li = event.target;
  li.classList.add("active");
  currentFilter = li.dataset.filter;
  loadTasks();
}

function loadTasks() {
  const user_id = localStorage.getItem("user_id");

  fetch(API_URL + "/viewtask/" + user_id)
    .then(res => res.json())
    .then(tasks => {
      const pendingCol = document.getElementById("pending");
      const progressCol = document.getElementById("progress");
      const completedCol = document.getElementById("completed");

      pendingCol.innerHTML = "";
      progressCol.innerHTML = "";
      completedCol.innerHTML = "";

      let total = 0, pending = 0, progress = 0, completed = 0;

      tasks.forEach(task => {
        if (currentFilter !== "All" && task.status !== currentFilter) return;

        const taskDiv = document.createElement("div");
        taskDiv.className = "task";
        taskDiv.id = `task-${task.task_id}`;
        taskDiv.draggable = true;
        taskDiv.ondragstart = drag;

        taskDiv.innerHTML = `
          <h4>${task.title}</h4>
          <p>${task.description}</p>
          <p>Priority: ${task.priority}</p>
          <p>Status: ${task.status}</p>
          <p>Deadline: ${task.deadline}</p>
          <button onclick="deleteTask(${task.task_id})">Delete</button>
          <button onclick="editTask(${task.task_id})">Edit</button>
        `;

        if (task.status === "Pending") {
          pendingCol.appendChild(taskDiv);
          pending++;
        } else if (task.status === "In Progress") {
          progressCol.appendChild(taskDiv);
          progress++;
        } else if (task.status === "Completed") {
          completedCol.appendChild(taskDiv);
          completed++;
        }

        total++;

        // Reminder notification if deadline is today
        const today = new Date().toISOString().split("T")[0];
        if (task.deadline === today) {
          notifyTask(task.title, task.deadline);
        }
        renderCalendar(tasks);
      });

      // Update analytics cards
      document.getElementById("totalTasks").innerText = total;
      document.getElementById("pendingTasks").innerText = pending;
      document.getElementById("completedTasks").innerText = completed;

      // Update productivity chart
      productivityChart.data.datasets[0].data = [completed, pending, progress];
      productivityChart.update();
    });
}

// =========================
// DELETE TASK
// =========================
function deleteTask(id) {
  fetch(API_URL + "/delete-task/" + id, { method: "DELETE" })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadTasks();
    });
}

// =========================
// EDIT TASK
// =========================
let editingTaskId = null;

function editTask(task_id) {
  editingTaskId = task_id;

  fetch(API_URL + "/viewtask/" + localStorage.getItem("user_id"))
    .then(res => res.json())
    .then(tasks => {
      const task = tasks.find(t => t.task_id === task_id);

      document.getElementById("edit_title").value = task.title;
      document.getElementById("edit_description").value = task.description;
      document.getElementById("edit_priority").value = task.priority;
      document.getElementById("edit_status").value = task.status;
      document.getElementById("edit_deadline").value = task.deadline;

      document.getElementById("editModal").style.display = "block";
    });
}

function updateTask() {
  fetch(API_URL + "/update-task/" + editingTaskId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.getElementById("edit_title").value,
      description: document.getElementById("edit_description").value,
      priority: document.getElementById("edit_priority").value,
      status: document.getElementById("edit_status").value,
      deadline: document.getElementById("edit_deadline").value
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      closeEdit();
      loadTasks();
    });
}

// =========================
// AUTH
// =========================
function signup() {
  fetch(API_URL + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      window.location = "/";
    });
}

function login() {
  fetch(API_URL + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.user_id) {
        localStorage.setItem("user_id", data.user_id);
        window.location.href = "/dashboard";
      } else {
        alert("Invalid login credentials");
      }
    });
}

function logout() {
  localStorage.removeItem("user_id");
  window.location.href = "/";
}

// =========================
// DRAG & DROP
// =========================
function allowDrop(event) {
  event.preventDefault();
}
function drag(event) {
  event.dataTransfer.setData("task_id", event.target.id);
}
function drop(event, status) {
  event.preventDefault();
  const taskElement = event.dataTransfer.getData("task_id");
  const task_id = taskElement.split("-")[1];
  updateTaskStatus(task_id, status);
  loadTasks();
}

function updateTaskStatus(task_id, status) {
  fetch(API_URL + "/update-task/" + task_id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: status })
  })
    .then(res => res.json())
    .then(data => {
      console.log(data.message);
    });
}

// =========================
// PAGE LOAD
// =========================
document.addEventListener("DOMContentLoaded", function () {
  loadTasks();
});

// =========================
// DARK MODE
// =========================
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

// =========================
// SEARCH TASKS
// =========================
function searchTasks() {
  const query = document.getElementById("searchBar").value.toLowerCase();
  const tasks = document.querySelectorAll(".task");
  tasks.forEach(task => {
    task.style.display = task.innerText.toLowerCase().includes(query) ? "block" : "none";
  });
}

// =========================
// PRODUCTIVITY CHART
// =========================
const ctx = document.getElementById("productivityChart").getContext("2d");
const productivityChart = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["Completed", "Pending", "In Progress"],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ["#4caf50", "#ff9800", "#2196f3"]
    }]
  }
});

// =========================
// NOTIFICATIONS
// =========================
function notifyTask(taskTitle, deadline) {
  if (Notification.permission === "granted") {
    new Notification("Task Reminder", {
      body: `${taskTitle} is due on ${deadline}`,
      icon: "/static/notify.png"
    });
  } else {
    Notification.requestPermission();
  }
}
function renderCalendar(tasks) {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";

  // Group tasks by deadline
  const grouped = {};
  tasks.forEach(task => {
    if (!task.deadline) return;
    if (!grouped[task.deadline]) grouped[task.deadline] = [];
    grouped[task.deadline].push(task);
  });

  // Build calendar list
  for (const date in grouped) {
    const dateBlock = document.createElement("div");
    dateBlock.className = "calendar-day";

    const heading = document.createElement("h4");
    heading.innerText = `📌 ${date}`;
    dateBlock.appendChild(heading);

    grouped[date].forEach(task => {
      const item = document.createElement("p");
      item.innerText = `${task.title} (${task.status})`;
      dateBlock.appendChild(item);
    });

    container.appendChild(dateBlock);
  }
}
function updateScore() {
  const completed = tasks.filter(t => t.status === "Completed").length;
  const total = tasks.length;
  const score = total ? Math.round((completed / total) * 100) : 0;
  document.getElementById("productivityScore").innerText = score + "%";
  document.getElementById("productivityBar").style.width = score + "%";
  renderScoreChart();
}

function renderScoreChart(score) {
  new Chart(document.getElementById("scoreChart"), {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Remaining'],
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: ['#4caf50', '#ddd']
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false }
      }
    }
  });
}

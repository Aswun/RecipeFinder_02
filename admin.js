document.addEventListener("DOMContentLoaded", () => {
  const userForm = document.getElementById("user-form");
  const userIdInput = document.getElementById("user-id");
  const userNameInput = document.getElementById("user-name");
  const userRolesInput = document.getElementById("user-roles");
  const userPasswordInput = document.getElementById("user-password");
  const usersTableBody = document.querySelector("#users-table tbody");

  const API_URL = "api_users.php";

  // Optional: Restrict access to admins only
  // const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  // if (loggedInUser.roles !== "admin") {
  //   alert("Access denied. Admins only.");
  //   window.location.href = "index.html";
  //   return;
  // }

  // Fetch all users
  async function getUsers() {
    try {
      const response = await fetch(`${API_URL}?action=read`);
      const data = await response.json();
      if (Array.isArray(data)) return data;
      throw new Error(data.error || "Failed to fetch users");
    } catch (error) {
      alert(error.message);
      return [];
    }
  }

  // Render users in the table
  async function renderUsers() {
    const users = await getUsers();
    usersTableBody.innerHTML = "";
    users.forEach(user => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.roles || ''}</td>
        <td>••••••</td>
        <td>
          <button class="edit-btn" data-id="${user.id}">Edit</button>
          <button class="delete-btn" data-id="${user.id}">Delete</button>
        </td>
      `;
      usersTableBody.appendChild(row);
    });

    // Add event listeners to buttons
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        editUser(Number(btn.dataset.id));
      });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        deleteUser(Number(btn.dataset.id));
      });
    });
  }

  // Fill form for editing
  async function editUser(id) {
    const users = await getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return alert("User not found");

    userIdInput.value = user.id;
    userNameInput.value = user.name;
    userRolesInput.value = user.roles || '';
    userPasswordInput.value = ""; // Leave password blank for security
  }

  // Delete user
  async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`${API_URL}?action=delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (data.success) {
        alert("User deleted successfully");
        renderUsers();
      } else {
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      alert(error.message);
    }
  }

  // Handle form submit for create/update
  userForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = userIdInput.value.trim();
    const name = userNameInput.value.trim();
    const roles = userRolesInput.value.trim();
    const password = userPasswordInput.value;

    if (!name || !roles) {
      alert("Please fill all required fields (name and roles)");
      return;
    }

    const payload = { name, roles };
    if (password) payload.password = password;
    if (id) payload.id = Number(id);

    const action = id ? "update" : "create";

    try {
      const response = await fetch(`${API_URL}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(`User ${action === "create" ? "created" : "updated"} successfully`);
        userForm.reset();
        userIdInput.value = "";
        renderUsers();
      } else {
        alert(data.error || "Failed to save user");
      }
    } catch (error) {
      alert(error.message);
    }
  });

  // Initial render
  renderUsers();
});

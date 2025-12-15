// ==========================
// 🔒 Minions Unified User Widget + Session Manager (Live Data)
// ==========================

// --- CONFIG ---
const SESSION_CHECK_URL = "session_check.php";
const LOGOUT_URL = "logout.php";
const LOGIN_PAGE = "https://melog.minionsenterprises.com/";

// --- 1️⃣ AUTO SESSION CHECK ---
async function checkSession() {
  try {
    const res = await fetch(SESSION_CHECK_URL, { credentials: "include" });
    const data = await res.json();

    if (!data.logged_in) {
      window.location.href = LOGIN_PAGE;
      return null;
    }

    return {
      username: data.username || "Unknown",
      role: data.role || "User",
      company: data.company || "Minions Enterprises",
  
    };
  } catch (err) {
    console.error("Session check failed:", err);
    return null;
  }
}

// --- 2️⃣ STYLING ---
const style = document.createElement("style");
style.textContent = `
  .user-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .user-circle {
    width: 42px;
    height: 42px;
    background: #007bff;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.2s ease;
  }

  .user-circle:hover { transform: scale(1.05); }

  .user-popup {
    position: absolute;
    top: 55px;
    right: 0;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    padding: 15px;
    display: none;
    flex-direction: column;
    gap: 12px;
    min-width: 240px;
    z-index: 999;
  }

  .user-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .user-field label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #555;
  }

  .user-field input {
    width: 90%;
    border: none;
    background: #f1f3f5;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 0.9rem;
    color: #333;
    cursor: not-allowed;
  }

  .user-field input:disabled { opacity: 1; }

  .logout-btn {
    margin-top: 8px;
    padding: 8px 0;
    border: none;
    border-radius: 8px;
    background: #dc3545;
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .logout-btn:hover { background: #c82333; }
`;
document.head.appendChild(style);

// --- 3️⃣ CREATE WIDGET ---
function createUserWidget(userData) {
  const container = document.createElement("div");
  container.className = "user-container";

  const circle = document.createElement("div");
  circle.className = "user-circle";
  circle.textContent = userData.username.charAt(0).toUpperCase();

  const popup = document.createElement("div");
  popup.className = "user-popup";

  const fields = [
    { label: "Username", value: userData.username },
    { label: "Role", value: userData.role },
    { label: "Company", value: userData.company },
  
  ];

  fields.forEach(({ label, value }) => {
    const field = document.createElement("div");
    field.className = "user-field";

    const lbl = document.createElement("label");
    lbl.textContent = label;

    const input = document.createElement("input");
    input.value = value;
    input.disabled = true;

    field.appendChild(lbl);
    field.appendChild(input);
    popup.appendChild(field);
  });

  // --- Logout button ---
  const logoutBtn = document.createElement("button");
  logoutBtn.className = "logout-btn";
  logoutBtn.textContent = "Logout";
  logoutBtn.addEventListener("click", async () => {
    try {
      const res = await fetch(LOGOUT_URL, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        window.location.href = LOGIN_PAGE;
      } else {
        alert("Logout failed. Please try again.");
      }
    } catch {
      alert("Logout failed. Try again later.");
    }
  });

  popup.appendChild(logoutBtn);
  container.appendChild(circle);
  container.appendChild(popup);

  circle.addEventListener("click", () => {
    popup.style.display = popup.style.display === "flex" ? "none" : "flex";
  });

  document.addEventListener("click", (e) => {
    if (!circle.contains(e.target) && !popup.contains(e.target)) {
      popup.style.display = "none";
    }
  });

  return container;
}

// --- 4️⃣ INIT ---
(async () => {
  const userData = await checkSession();
  if (!userData) return;

  const target = document.getElementById("user-widget");
  if (target) {
    const widget = createUserWidget(userData);
    target.appendChild(widget);
  }

  // Periodic recheck (every 5 min)
  setInterval(async () => {
    const valid = await checkSession();
    if (!valid) window.location.href = LOGIN_PAGE;
  }, 300000);
})();

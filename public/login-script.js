const form = document.getElementById("loginForm");
const message = document.getElementById("message");

// Dynamically detect API URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000'
  : `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;

// get input elements so we can read their values
const email = document.getElementById("email");
const password = document.getElementById("password");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const res = await axios.post(
      `${API_URL}/api/v1/users/login`,
      {
        email: email.value,
        password: password.value
      }
    );

    // save JWT
    localStorage.setItem("token", res.data.token);

    // Extract userId from token or use user data
    try {
      if (res.data.user && res.data.user._id) {
        localStorage.setItem("userId", res.data.user._id);
      } else {
        // Fallback: extract from JWT token
        const payload = JSON.parse(atob(res.data.token.split('.')[1]));
        if (payload.id) {
          localStorage.setItem("userId", payload.id);
        }
      }
    } catch (e) {
      console.warn('Could not extract userId from token', e);
    }

    message.style.color = "#0a8f3f";
    message.textContent = "Login successful!";

    setTimeout(() => {
      // redirect to home page after successful login
      message.textContent = "loading..."  
      window.location.href = 'home.html';
    }, 800);
  } catch (err) {
    const serverMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      (err?.response?.data ? JSON.stringify(err.response.data) : null) ||
      err?.message ||
      "Login failed";

    console.error('Login error:', err);
    message.style.color = '#b00020';
    message.textContent = serverMessage;
  }
});

// toggle password functionality for login
const toggles = document.querySelectorAll('.toggle-password');
toggles.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
    } else {
      input.type = 'password';
      btn.textContent = '👁';
    }
  });
});
const form = document.getElementById("registerForm");
  const message = document.getElementById("message");

  // get input elements so we can read their values
  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      // Validate inputs
      if (!name.value || !email.value || !password.value || !confirmPassword.value) {
        message.textContent = "❌ Please fill in all fields";
        message.style.color = "#c00";
        return;
      }

      // Validate password length
      if (password.value.length < 6) {
        message.textContent = "❌ Password must be at least 6 characters long";
        message.style.color = "#c00";
        return;
      }

      if (password.value !== confirmPassword.value) {
        message.textContent = "❌ Passwords do not match";
        message.style.color = "#c00";
        return;
      }

      // Show loading state
      message.style.color = "#0066cc";
      message.textContent = "📝 Registering... Please wait.";

      const res = await axios.post(
        "http://localhost:4000/api/v1/users/register",
        {
          name: name.value,
          email: email.value,
          password: password.value,
          confirmPassword: confirmPassword.value
        }
      );

      message.style.color = "#0a8f3f";
      message.textContent = "✅ " + res.data.message;
      // Clear form
      form.reset();
      // Redirect to confirm email page after successful registration
      setTimeout(() => {
        message.textContent = "📧 Redirecting to email confirmation...";
        window.location.href = 'confirm-email.html';
      }, 2000);
    } catch (err) {
      // axios uses `response` for server responses — handle network errors too
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.response?.data ? JSON.stringify(err.response.data) : null) ||
        err?.message ||
        "Registration failed";

      message.style.color = "#c00";
      message.textContent = "❌ " + serverMessage;
      console.error('Registration error:', err);
    }
  });



// toggle password functionality for register page
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
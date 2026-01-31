/**
 * FIXED: Authentication Integration Script
 * Handles both registration and login flows properly
 * 
 * This script replaces separate scripts with a unified approach
 */

// API Base URL - Change for production
const API_URL = 'http://localhost:4000/api/v1/users';

// Check if axios is loaded
if (typeof axios === 'undefined') {
  console.error('Axios is not loaded! Make sure it is included before this script.');
}

// ============ REGISTRATION FLOW ============
function initializeRegistration() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const messageDiv = document.getElementById('message');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      showMessage(messageDiv, 'All fields are required', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showMessage(messageDiv, 'Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage(messageDiv, 'Password must be at least 6 characters', 'error');
      return;
    }

    try {
      console.log('Attempting to register user with:', { name, email });
      const response = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
        confirmPassword
      });

      console.log('Registration response:', response);

      if (response.status === 201 || response.data.success) {
        showMessage(messageDiv, '✅ Registration successful! Check your email to confirm your account.', 'success');
        registerForm.reset();

        // Optional: Redirect after delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      }
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      
      let errorMsg = 'Registration failed';
      
      if (error.response) {
        // Server responded with error status
        errorMsg = error.response.data?.message || 
                   error.response.data?.error || 
                   `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMsg = 'No response from server. Please check your connection.';
      } else {
        // Error setting up the request
        errorMsg = error.message || 'Network error occurred';
      }
      
      console.error('Registration error:', errorMsg);
      showMessage(messageDiv, errorMsg, 'error');
    }
  });
}

// ============ LOGIN FLOW ============
function initializeLogin() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const messageDiv = document.getElementById('message');

    // Validation
    if (!email || !password) {
      showMessage(messageDiv, 'Email and password are required', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage(messageDiv, 'Invalid credentials', 'error');
      return;
    }

    try {
      console.log('Attempting to login with email:', email);
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      });

      console.log('Login response:', response);

      if (response.status === 200 && response.data.token) {
        // ✅ STORE TOKEN AND USER DATA
        localStorage.setItem('token', response.data.token);
        
        if (response.data.user) {
          localStorage.setItem('userId', response.data.user.id);
          localStorage.setItem('userName', response.data.user.name);
          localStorage.setItem('userEmail', response.data.user.email);
        }

        showMessage(messageDiv, '✅ Login successful! Redirecting...', 'success');
        loginForm.reset();

        // Redirect to home after successful login
        setTimeout(() => {
          window.location.href = 'home.html';
        }, 800);
      } else {
        showMessage(messageDiv, 'Login failed - unexpected response', 'error');
      }
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      
      let errorMsg = 'Login failed';
      
      if (error.response) {
        // Server responded with error status
        errorMsg = error.response.data?.message || 
                   error.response.data?.error || 
                   `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMsg = 'No response from server. Please check your connection.';
      } else {
        // Error setting up the request
        errorMsg = error.message || 'Network error occurred';
      }
      
      console.error('Login error:', errorMsg);
      showMessage(messageDiv, errorMsg, 'error');
    }
  });
}

// ============ PASSWORD VISIBILITY TOGGLE ============
function initializePasswordToggle() {
  const toggleButtons = document.querySelectorAll('.toggle-password');
  
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      
      if (!input) return;
      
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '👁️‍🗨️';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });
}

// ============ HELPER FUNCTIONS ============
function showMessage(element, text, type) {
  if (!element) return;
  
  element.textContent = text;
  element.style.color = type === 'success' ? '#0a8f3f' : '#b00020';
  element.style.display = 'block';
}

function getToken() {
  return localStorage.getItem('token');
}

function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  window.location.href = 'login.html';
}

// ============ INITIALIZE ON PAGE LOAD ============
document.addEventListener('DOMContentLoaded', () => {
  initializeRegistration();
  initializeLogin();
  initializePasswordToggle();
});

// Export for use in other scripts
window.AuthAPI = {
  getToken,
  isLoggedIn,
  logout,
  API_URL
};

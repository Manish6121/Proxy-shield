// Central Authentication & Route Guard Utilities
function getAuthUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function getAuthToken() {
  return localStorage.getItem('token');
}

function checkAuthGuard(requiredRole) {
  const user = getAuthUser();
  const token = getAuthToken();

  if (!user || !token) {
    window.location.href = '/views/login.html';
    return;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'student') window.location.href = '/views/student/dashboard.html';
    else if (user.role === 'faculty') window.location.href = '/views/faculty/console.html';
  }
}

function logout() {
  localStorage.clear();
  window.location.href = '/views/login.html';
}

// Single Login Page Handler
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;
    const alertBox = document.getElementById('loginAlert');

    alertBox.style.display = 'block';
    alertBox.style.background = '#142038';
    alertBox.style.color = '#fff';
    alertBox.textContent = 'Authenticating user credentials...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        alertBox.style.background = 'rgba(0, 230, 118, 0.2)';
        alertBox.style.color = '#00e676';
        alertBox.textContent = `✓ Welcome ${data.user.name}! Redirecting...`;

        setTimeout(() => {
          if (data.user.role === 'student') window.location.href = '/views/student/dashboard.html';
          else if (data.user.role === 'faculty') window.location.href = '/views/faculty/console.html';
        }, 800);
      } else {
        alertBox.style.background = 'rgba(255, 23, 68, 0.2)';
        alertBox.style.color = '#ff1744';
        alertBox.textContent = '✕ ' + data.message;
      }
    } catch (err) {
      alertBox.style.background = 'rgba(255, 23, 68, 0.2)';
      alertBox.style.color = '#ff1744';
      alertBox.textContent = 'Network error during login.';
    }
  });
}

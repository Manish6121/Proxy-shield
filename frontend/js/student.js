document.addEventListener('DOMContentLoaded', () => {
  checkAuthGuard('student');
  const user = getAuthUser();
  if (user && document.getElementById('studentInfo')) {
    document.getElementById('studentInfo').textContent = `${user.name} (Roll: ${user.identifier})`;
  }

  loadAttendanceHistory();
});

function submitStudentCheckIn() {
  const code = document.getElementById('studentTotp').value;
  const status = document.getElementById('studentStatus');
  status.style.display = 'block';
  status.style.background = '#142038';
  status.style.color = '#fff';
  status.textContent = 'Accessing GPS sensors & verifying 15s TOTP...';

  if (!code || code.length !== 6) {
    status.style.background = 'rgba(255, 23, 68, 0.2)';
    status.style.color = '#ff1744';
    status.textContent = '✕ Please enter a valid 6-digit passcode.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const res = await fetch('/api/student/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            code: code,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            alt: pos.coords.altitude
          })
        });

        const data = await res.json();
        if (data.success) {
          status.style.background = 'rgba(0, 230, 118, 0.2)';
          status.style.color = '#00e676';
          status.textContent = '✓ ' + data.message;
          loadAttendanceHistory();
        } else {
          status.style.background = 'rgba(255, 23, 68, 0.2)';
          status.style.color = '#ff1744';
          status.textContent = '✕ Rejection: ' + data.message;
        }
      } catch (err) {
        status.style.background = 'rgba(255, 23, 68, 0.2)';
        status.style.color = '#ff1744';
        status.textContent = 'Network error processing check-in.';
      }
    },
    (err) => {
      status.style.background = 'rgba(255, 23, 68, 0.2)';
      status.style.color = '#ff1744';
      status.textContent = 'GPS Permission Denied: ' + err.message;
    },
    { enableHighAccuracy: true }
  );
}

async function loadAttendanceHistory() {
  const historyTable = document.getElementById('historyTable');
  if (!historyTable) return;

  try {
    const res = await fetch('/api/student/history', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    const data = await res.json();

    if (data.success && data.history.length > 0) {
      historyTable.innerHTML = data.history.map(r => `
        <tr>
          <td>${r.date} ${r.time}</td>
          <td>${r.course}</td>
          <td>${r.room}</td>
          <td><span class="badge-success">VERIFIED</span></td>
        </tr>
      `).join('');
    } else {
      historyTable.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--muted);">No verified check-ins recorded yet.</td></tr>`;
    }
  } catch (err) {
    console.error("Error loading history", err);
  }
}

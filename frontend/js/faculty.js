document.addEventListener('DOMContentLoaded', () => {
  checkAuthGuard('faculty');
  const user = getAuthUser();
  if (user && document.getElementById('facultyInfo')) {
    document.getElementById('facultyInfo').textContent = `${user.name} (${user.identifier})`;
  }

  loadFacultyData();
});

function triggerAutoFence() {
  const status = document.getElementById('facultyStatus');
  status.style.display = 'block';
  status.style.background = '#142038';
  status.style.color = '#fff';
  status.textContent = 'Capturing faculty hardware GPS location...';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const res = await fetch('/api/faculty/auto-fence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            alt: pos.coords.altitude
          })
        });

        const data = await res.json();
        if (data.success) {
          status.style.background = 'rgba(0, 230, 118, 0.2)';
          status.style.color = '#00e676';
          status.textContent = `✓ 5-Point Pentagon Auto-Geofence Active around (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
        }
      } catch (err) {
        status.style.background = 'rgba(255, 23, 68, 0.2)';
        status.style.color = '#ff1744';
        status.textContent = 'Error sending geofence coordinates.';
      }
    },
    (err) => {
      status.style.background = 'rgba(255, 23, 68, 0.2)';
      status.style.color = '#ff1744';
      status.textContent = 'GPS Error: ' + err.message;
    },
    { enableHighAccuracy: true }
  );
}

async function loadFacultyData() {
  const auditTable = document.getElementById('auditTable');
  if (!auditTable) return;

  try {
    const res = await fetch('/api/faculty/data', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    const data = await res.json();

    if (data.incidents && data.incidents.length > 0) {
      auditTable.innerHTML = data.incidents.map(i => `
        <tr>
          <td>${i.id}</td>
          <td>${i.time}</td>
          <td>${i.student} (${i.studentId})</td>
          <td style="color:#ff1744; font-weight:bold;">${i.type}</td>
          <td><span class="badge-danger">REJECTED</span></td>
        </tr>
      `).join('');
    } else {
      auditTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--muted);">No security breaches recorded yet.</td></tr>`;
    }
  } catch (err) {
    console.error("Error loading faculty data", err);
  }
}

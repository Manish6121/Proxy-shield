async function syncTOTP() {
  try {
    const res = await fetch('/api/totp');
    const data = await res.json();
    if (document.getElementById('liveTotpCode')) {
      document.getElementById('liveTotpCode').textContent = data.code;
    }
    if (document.getElementById('totpTimer')) {
      document.getElementById('totpTimer').textContent = data.timeRemaining;
    }
    if (data.session) {
      if (document.getElementById('projCourse')) document.getElementById('projCourse').textContent = data.session.course;
      if (document.getElementById('projRoom')) document.getElementById('projRoom').textContent = `${data.session.room} | ${data.session.faculty}`;
    }
  } catch (e) {
    console.error("TOTP Sync Error", e);
  }
}

setInterval(syncTOTP, 1000);
syncTOTP();

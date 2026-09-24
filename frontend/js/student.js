const user = requireAuth('student');

if (user) {
  document.getElementById('studentName').textContent = `${user.name} (Year ${user.year} - Sec ${user.section})`;
  document.getElementById('cardTitle').textContent = `Upcoming Exams — Year ${user.year}, Section ${user.section}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function loadExams() {
  const tableWrapper = document.getElementById('tableWrapper');
  try {
    const exams = await apiRequest('/exams');

    if (!exams.length) {
      tableWrapper.innerHTML = `<div class="empty-state">No exams scheduled for your year & section yet.</div>`;
      return;
    }

    const rows = exams.map(ex => `
      <tr>
        <td>${escapeHtml(ex.subject)}</td>
        <td>${ex.exam_date}</td>
        <td>${ex.exam_time}</td>
        <td>${escapeHtml(ex.room || '—')}</td>
      </tr>
    `).join('');

    tableWrapper.innerHTML = `
      <table>
        <thead><tr><th>Subject</th><th>Date</th><th>Time</th><th>Room</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    tableWrapper.innerHTML = `<div class="empty-state">Failed to load exams: ${err.message}</div>`;
  }
}

loadExams();

const user = requireAuth('admin');
if (user) document.getElementById('adminName').textContent = `${user.name} (Admin)`;

const form = document.getElementById('examForm');
const errorMsg = document.getElementById('errorMsg');
const tableWrapper = document.getElementById('tableWrapper');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');

let editingId = null;

async function loadExams() {
  try {
    const exams = await apiRequest('/exams');
    renderTable(exams);
  } catch (err) {
    tableWrapper.innerHTML = `<div class="empty-state">Failed to load exams: ${err.message}</div>`;
  }
}

function renderTable(exams) {
  if (!exams.length) {
    tableWrapper.innerHTML = `<div class="empty-state">No exams scheduled yet. Add one above.</div>`;
    return;
  }

  const rows = exams.map(ex => `
    <tr>
      <td>${escapeHtml(ex.subject)}</td>
      <td>${ex.exam_date}</td>
      <td>${ex.exam_time}</td>
      <td><span class="badge">Year ${ex.year} - ${escapeHtml(ex.section)}</span></td>
      <td>${escapeHtml(ex.room || '—')}</td>
      <td class="actions-cell">
        <button class="btn-secondary" onclick="startEdit(${ex.id})">Edit</button>
        <button class="btn-danger" onclick="deleteExam(${ex.id})">Delete</button>
      </td>
    </tr>
  `).join('');

  tableWrapper.innerHTML = `
    <table>
      <thead>
        <tr><th>Subject</th><th>Date</th><th>Time</th><th>Year / Section</th><th>Room</th><th>Actions</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  window.__examsCache = exams;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';

  const payload = {
    subject: document.getElementById('subject').value.trim(),
    exam_date: document.getElementById('exam_date').value,
    exam_time: document.getElementById('exam_time').value,
    year: Number(document.getElementById('year').value),
    section: document.getElementById('section').value,
    room: document.getElementById('room').value.trim()
  };

  try {
    if (editingId) {
      await apiRequest(`/exams/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiRequest('/exams', { method: 'POST', body: JSON.stringify(payload) });
    }
    resetForm();
    loadExams();
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = 'block';
  }
});

function startEdit(id) {
  const exam = (window.__examsCache || []).find(x => x.id === id);
  if (!exam) return;

  editingId = id;
  document.getElementById('subject').value = exam.subject;
  document.getElementById('room').value = exam.room || '';
  document.getElementById('exam_date').value = exam.exam_date;
  document.getElementById('exam_time').value = exam.exam_time;
  document.getElementById('year').value = exam.year;
  document.getElementById('section').value = exam.section;

  formTitle.textContent = 'Edit Exam';
  submitBtn.textContent = 'Update Exam';
  cancelEditBtn.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = 'Schedule a New Exam';
  submitBtn.textContent = 'Schedule Exam';
  cancelEditBtn.style.display = 'none';
}

cancelEditBtn.addEventListener('click', resetForm);

async function deleteExam(id) {
  if (!confirm('Delete this exam?')) return;
  try {
    await apiRequest(`/exams/${id}`, { method: 'DELETE' });
    loadExams();
  } catch (err) {
    alert(err.message);
  }
}

loadExams();

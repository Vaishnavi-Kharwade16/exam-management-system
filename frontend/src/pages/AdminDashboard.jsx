import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { apiRequest, getUser } from '../api';

const EMPTY_FORM = { subject: '', exam_date: '', exam_time: '', year: '', section: '', room: '' };

export default function AdminDashboard() {
  const user = getUser();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    setLoading(true);
    try {
      const data = await apiRequest('/exams');
      setExams(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.id]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const payload = {
      subject: form.subject.trim(),
      exam_date: form.exam_date,
      exam_time: form.exam_time,
      year: Number(form.year),
      section: form.section,
      room: form.room.trim()
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
      setError(err.message);
    }
  }

  function startEdit(exam) {
    setEditingId(exam.id);
    setForm({
      subject: exam.subject,
      exam_date: exam.exam_date,
      exam_time: exam.exam_time,
      year: String(exam.year),
      section: exam.section,
      room: exam.room || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await apiRequest(`/exams/${id}`, { method: 'DELETE' });
      loadExams();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <Navbar title="Exam Timetable — Admin" userLabel={`${user?.name} (Admin)`} />

      <div className="container">
        <div className="card">
          <h3>{editingId ? 'Edit Exam' : 'Schedule a New Exam'}</h3>
          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label htmlFor="subject">Subject</label>
                <input id="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Data Structures" required />
              </div>
              <div>
                <label htmlFor="room">Room (optional)</label>
                <input id="room" value={form.room} onChange={handleChange} placeholder="e.g. Room 204" />
              </div>
              <div>
                <label htmlFor="exam_date">Date</label>
                <input id="exam_date" type="date" value={form.exam_date} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="exam_time">Time</label>
                <input id="exam_time" type="time" value={form.exam_time} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="year">Academic Year</label>
                <select id="year" value={form.year} onChange={handleChange} required>
                  <option value="">Select Year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>
              <div>
                <label htmlFor="section">Section</label>
                <select id="section" value={form.section} onChange={handleChange} required>
                  <option value="">Select Section</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Exam' : 'Schedule Exam'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: 8, width: '100%' }}
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        <div className="card">
          <h3>All Scheduled Exams</h3>
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : exams.length === 0 ? (
            <div className="empty-state">No exams scheduled yet. Add one above.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Subject</th><th>Date</th><th>Time</th><th>Year / Section</th><th>Room</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((ex) => (
                  <tr key={ex.id}>
                    <td>{ex.subject}</td>
                    <td>{ex.exam_date}</td>
                    <td>{ex.exam_time}</td>
                    <td><span className="badge">Year {ex.year} - {ex.section}</span></td>
                    <td>{ex.room || '—'}</td>
                    <td className="actions-cell">
                      <button className="btn-secondary" onClick={() => startEdit(ex)}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(ex.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

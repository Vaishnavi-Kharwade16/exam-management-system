import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { apiRequest, getUser } from '../api';

const EMPTY_FORM = { subject: '', exam_date: '', start_time: '', end_time: '', year: '', section: '' };

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

    // Client-side mirror of the server-side "end > start" rule, for fast feedback.
    // The server re-validates this independently — the client check is UX only.
    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      setError('End time must be strictly after start time.');
      return;
    }

    const payload = {
      subject: form.subject.trim(),
      exam_date: form.exam_date,
      start_time: form.start_time,
      end_time: form.end_time,
      year: Number(form.year),
      section: form.section
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
      start_time: exam.start_time,
      end_time: exam.end_time,
      year: String(exam.year),
      section: exam.section
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  async function handleDelete(id) {
    if (!window.confirm('Cancel this exam?')) return;
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
              <div className="full">
                <label htmlFor="subject">Subject</label>
                <input id="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Data Structures" required />
              </div>
              <div>
                <label htmlFor="exam_date">Exam Date</label>
                <input id="exam_date" type="date" value={form.exam_date} onChange={handleChange} required />
              </div>
              <div></div>
              <div>
                <label htmlFor="start_time">Start Time</label>
                <input id="start_time" type="time" value={form.start_time} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="end_time">End Time</label>
                <input id="end_time" type="time" value={form.end_time} onChange={handleChange} required />
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
                  <th>Subject</th><th>Date</th><th>Start</th><th>End</th><th>Year / Section</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((ex) => (
                  <tr key={ex.id}>
                    <td>{ex.subject}</td>
                    <td>{ex.exam_date}</td>
                    <td>{ex.start_time}</td>
                    <td>{ex.end_time}</td>
                    <td><span className="badge">Year {ex.year} - {ex.section}</span></td>
                    <td className="actions-cell">
                      <button className="btn-secondary" onClick={() => startEdit(ex)}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(ex.id)}>Cancel</button>
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

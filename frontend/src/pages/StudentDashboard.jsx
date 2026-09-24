import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { apiRequest, getUser } from '../api';

export default function StudentDashboard() {
  const user = getUser();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <>
      <Navbar
        title="My Exam Timetable"
        userLabel={`${user?.name} (Year ${user?.year} - Sec ${user?.section})`}
      />

      <div className="container">
        <div className="card">
          <h3>Upcoming Exams — Year {user?.year}, Section {user?.section}</h3>

          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : error ? (
            <div className="error-msg">{error}</div>
          ) : exams.length === 0 ? (
            <div className="empty-state">No exams scheduled for your year & section yet.</div>
          ) : (
            <table>
              <thead>
                <tr><th>Subject</th><th>Date</th><th>Time</th><th>Room</th></tr>
              </thead>
              <tbody>
                {exams.map((ex) => (
                  <tr key={ex.id}>
                    <td>{ex.subject}</td>
                    <td>{ex.exam_date}</td>
                    <td>{ex.exam_time}</td>
                    <td>{ex.room || '—'}</td>
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

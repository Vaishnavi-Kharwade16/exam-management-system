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
    setError('');
    try {
      const data = await apiRequest('/exams');
      setExams(data);
    } catch (err) {
      // Handles the "student profile missing year/section" edge case (409 from server)
      // as well as any other fetch error, with the server's message shown directly.
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const hasProfile = user?.year != null && user?.section;

  return (
    <>
      <Navbar
        title="My Exam Timetable"
        userLabel={hasProfile ? `${user?.name} (Year ${user?.year} - Sec ${user?.section})` : user?.name}
      />

      <div className="container">
        <div className="card">
          <h3>
            {hasProfile ? `Upcoming Exams — Year ${user?.year}, Section ${user?.section}` : 'Upcoming Exams'}
          </h3>

          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : error ? (
            <div className="error-msg">{error}</div>
          ) : exams.length === 0 ? (
            <div className="empty-state">No exams scheduled for your year & section yet.</div>
          ) : (
            <table>
              <thead>
                <tr><th>Subject</th><th>Date</th><th>Start</th><th>End</th></tr>
              </thead>
              <tbody>
                {exams.map((ex) => (
                  <tr key={ex.id}>
                    <td>{ex.subject}</td>
                    <td>{ex.exam_date}</td>
                    <td>{ex.start_time}</td>
                    <td>{ex.end_time}</td>
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

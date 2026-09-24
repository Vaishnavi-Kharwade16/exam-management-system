import { useNavigate } from 'react-router-dom';
import { clearSession } from '../api';

export default function Navbar({ title, userLabel }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate('/');
  }

  return (
    <div className="navbar">
      <h2>📅 {title}</h2>
      <div className="user-info">
        <span>{userLabel}</span>
        <button className="btn-secondary" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

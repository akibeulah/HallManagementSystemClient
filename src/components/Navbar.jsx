import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_HOME = {
  student: '/student',
  maintenance_officer: '/officer',
  admin: '/admin',
};

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!auth) return null;

  const home = ROLE_HOME[auth.user.role] || '/';

  return (
    <header className="bg-brand-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={home} className="text-lg font-bold tracking-tight">
          Hall Management System
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-brand-200">
            {auth.user.firstname} · <span className="capitalize">{auth.user.role.replace('_', ' ')}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-brand-100 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

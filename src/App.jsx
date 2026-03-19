import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import OfficerDashboard from './pages/OfficerDashboard.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import {
  OverviewPage, ComplaintsPage, UsersPage, UserDetailPage,
  HallsPage, AssetsPage, AISettingsPage,
} from './pages/AdminDashboard.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';

function RequireAuth({ children, roles }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(auth.user.role)) return <Navigate to="/login" replace />;
  return children;
}

function RoleRedirect() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  const map = { student: '/student', maintenance_officer: '/officer', admin: '/admin' };
  return <Navigate to={map[auth.user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/student" element={<RequireAuth roles={['student']}><StudentDashboard /></RequireAuth>} />
          <Route path="/officer" element={<RequireAuth roles={['maintenance_officer']}><OfficerDashboard /></RequireAuth>} />

          {/* Admin — nested under AdminLayout so sidebar persists */}
          <Route path="/admin" element={<RequireAuth roles={['admin']}><AdminLayout /></RequireAuth>}>
            <Route index element={<OverviewPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="complaints/:id" element={<ComplaintDetail />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="halls" element={<HallsPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="ai-settings" element={<AISettingsPage />} />
          </Route>

          {/* Students & officers use the standalone complaint detail */}
          <Route path="/complaints/:id" element={<RequireAuth roles={['student', 'maintenance_officer']}><ComplaintDetail /></RequireAuth>} />

          <Route path="/" element={<RoleRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

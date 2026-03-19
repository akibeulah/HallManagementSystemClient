import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import { register as registerApi, getHalls, getRooms } from '../api/index.js';

const CATEGORIES = ['woodwork', 'metalwork', 'electrical', 'plumbing'];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: '', lastname: '', email: '', password: '',
    gender: 'male', role: 'student', category: '', hallId: '', roomId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Only fetch halls if gender is set (for student role)
  const { data: halls = [] } = useQuery({
    queryKey: ['halls-register', form.gender],
    queryFn: async () => {
      // Temporarily use a public request — in production halls are fetched after login
      return [];
    },
    enabled: false,
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email.endsWith('@babcock.edu.ng')) {
      return setError('Only @babcock.edu.ng email addresses are allowed.');
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (form.role !== 'student') { delete payload.hallId; delete payload.roomId; }
      if (form.role !== 'maintenance_officer') delete payload.category;
      const { data } = await registerApi(payload);
      login(data.token, data.user);
      const ROLE_HOME = { student: '/student', maintenance_officer: '/officer', admin: '/admin' };
      navigate(ROLE_HOME[data.user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-800">Hall Management System</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your account</p>
        </div>
        <div className="card">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input className="input" value={form.firstname} onChange={set('firstname')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input className="input" value={form.lastname} onChange={set('lastname')} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="input" type="email" placeholder="you@babcock.edu.ng" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select className="input" value={form.gender} onChange={set('gender')}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="input" value={form.role} onChange={set('role')}>
                  <option value="student">Student</option>
                  <option value="maintenance_officer">Maintenance Officer</option>
                </select>
              </div>
            </div>
            {form.role === 'maintenance_officer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="input" value={form.category} onChange={set('category')} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

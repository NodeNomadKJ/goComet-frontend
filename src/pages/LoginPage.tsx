import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';
import type { UserRole } from '../types';

type Tab = 'RIDER' | 'DRIVER' | 'ADMIN';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('RIDER');
  const [form, setForm] = useState({ email: '', password: '' });

  const loginFn = tab === 'RIDER' ? authApi.riderLogin
    : tab === 'DRIVER' ? authApi.driverLogin
    : authApi.adminLogin;

  const mutation = useMutation({
    mutationFn: () => loginFn({ email: form.email, password: form.password }),
    onSuccess: (data) => {
      const tenantId = localStorage.getItem('tenantId') ?? '';
      const regionId = localStorage.getItem('regionId') ?? '';
      login(data.user, tenantId, regionId);
      const dest: Record<UserRole, string> = { RIDER: '/rider', DRIVER: '/driver', ADMIN: '/admin' };
      void navigate(dest[data.user.role] ?? '/');
    },
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h1>

        <div className="flex border-b border-gray-200 mb-6">
          {(['RIDER', 'DRIVER', 'ADMIN'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder={tab === 'RIDER' ? 'rahul@example.com' : tab === 'DRIVER' ? 'suresh@example.com' : 'admin@gocomet.com'}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Test@1234"
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {mutation.error && <ErrorAlert error={mutation.error} />}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-medium text-sm transition-colors"
          >
            {mutation.isPending ? 'Signing in...' : `Sign in as ${tab}`}
          </button>
        </form>

        {tab !== 'ADMIN' && (
          <p className="mt-4 text-sm text-gray-500 text-center">
            No account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
          </p>
        )}

        <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600">Demo credentials (password: Test@1234)</p>
          <p>Rider: rahul@example.com</p>
          <p>Driver: suresh@example.com</p>
          <p>Admin: admin@gocomet.com</p>
        </div>
      </div>
    </div>
  );
}

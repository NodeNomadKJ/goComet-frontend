import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';
import type { UserRole } from '../types';

type Tab = 'RIDER' | 'DRIVER';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('RIDER');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { name: form.name, email: form.email, phone: form.phone, password: form.password };
      return tab === 'RIDER' ? authApi.riderRegister(payload) : authApi.driverRegister(payload);
    },
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h1>

        <div className="flex border-b border-gray-200 mb-6">
          {(['RIDER', 'DRIVER'] as Tab[]).map(t => (
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={form.name} onChange={set('name')} required minLength={2}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set('email')} required
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (E.164)</label>
            <input value={form.phone} onChange={set('phone')} placeholder="+919876543210" required
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={8}
              placeholder="Min 8 chars, 1 uppercase, 1 digit"
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {mutation.error && <ErrorAlert error={mutation.error} />}

          <button type="submit" disabled={mutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-medium text-sm transition-colors">
            {mutation.isPending ? 'Creating account...' : `Register as ${tab}`}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-500 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

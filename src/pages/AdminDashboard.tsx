import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { ErrorAlert } from '../components/ErrorAlert';
import type { Tenant } from '../types';

type Tab = 'tenants' | 'regions';

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('tenants');
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex border-b border-gray-200 mb-6">
        {(['tenants','regions'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'tenants' && <TenantsTab />}
      {tab === 'regions' && <RegionsTab />}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className={`text-xs px-2 py-1 rounded border transition-colors font-mono ${copied ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
      {copied ? 'Copied!' : value.slice(0, 8) + '…'}
    </button>
  );
}

function TenantsTab() {
  const qc = useQueryClient();
  const { data: tenants, isLoading, error } = useQuery({ queryKey: ['admin','tenants'], queryFn: adminApi.getTenants });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', plan: 'STANDARD' });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createTenant(form),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin','tenants'] }); setShowAdd(false); setForm({ name: '', slug: '', plan: 'STANDARD' }); },
  });

  if (isLoading) return <p className="text-gray-500 text-sm">Loading...</p>;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-900">Tenants</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium">
          {showAdd ? 'Cancel' : '+ New Tenant'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="My Company"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="my-company"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
              <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>STANDARD</option>
                <option>PREMIUM</option>
              </select>
            </div>
          </div>
          {createMutation.error && <ErrorAlert error={createMutation.error} />}
          <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
            {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        Copy the Tenant ID and Region ID below and paste them into the login form to authenticate as rider/driver.
      </div>

      {(tenants ?? []).length === 0
        ? <p className="text-gray-500 text-sm">No tenants found.</p>
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Slug</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Tenant ID</th>
                </tr>
              </thead>
              <tbody>
                {(tenants ?? []).map((t: Tenant) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium">{t.name}</td>
                    <td className="py-2 pr-4 text-gray-500 font-mono text-xs">{t.slug}</td>
                    <td className="py-2 pr-4 text-gray-600">{t.plan}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2"><CopyButton value={t.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

function RegionsTab() {
  const qc = useQueryClient();
  const { data: tenants } = useQuery({ queryKey: ['admin','tenants'], queryFn: adminApi.getTenants });
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', countryCode: '', timezone: '' });

  const { data: regions, isLoading: loadingRegions } = useQuery({
    queryKey: ['admin','regions', selectedTenantId],
    queryFn: () => adminApi.getRegions(selectedTenantId),
    enabled: !!selectedTenantId,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createRegion(selectedTenantId, { name: form.name, countryCode: form.countryCode, ...(form.timezone && { timezone: form.timezone }) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin','regions', selectedTenantId] }); setShowAdd(false); setForm({ name: '', countryCode: '', timezone: '' }); },
  });

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-900">Regions</h2>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Select Tenant</label>
        <select value={selectedTenantId} onChange={e => setSelectedTenantId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Choose a tenant...</option>
          {(tenants ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {selectedTenantId && (
        <>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Regions for selected tenant</span>
            <button onClick={() => setShowAdd(!showAdd)}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium">
              {showAdd ? 'Cancel' : '+ New Region'}
            </button>
          </div>

          {showAdd && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Mumbai"
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Country Code</label>
                  <input value={form.countryCode} onChange={e => setForm(f => ({ ...f, countryCode: e.target.value }))}
                    placeholder="IND"
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Timezone</label>
                  <input value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                    placeholder="Asia/Kolkata"
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {createMutation.error && <ErrorAlert error={createMutation.error} />}
              <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
                {createMutation.isPending ? 'Creating...' : 'Create Region'}
              </button>
            </div>
          )}

          {loadingRegions && <p className="text-gray-500 text-sm">Loading regions...</p>}
          {(regions ?? []).length === 0 && !loadingRegions
            ? <p className="text-gray-500 text-sm">No regions for this tenant.</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Country</th>
                      <th className="py-2 pr-4">Timezone</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Region ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(regions ?? []).map(r => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 pr-4 font-medium">{r.name}</td>
                        <td className="py-2 pr-4 text-gray-500">{r.countryCode}</td>
                        <td className="py-2 pr-4 text-gray-500 text-xs">{r.timezone}</td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2"><CopyButton value={r.id} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </>
      )}
    </div>
  );
}

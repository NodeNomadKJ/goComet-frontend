import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRiderSocket } from '../hooks/useRiderSocket';
import { riderApi } from '../api/rider';
import { rideApi } from '../api/ride';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import type { FareEstimate, PaymentMethodType, Ride, VehicleType } from '../types';

type Tab = 'profile' | 'active-ride' | 'book' | 'payments' | 'history';

const VEHICLE_TYPES: VehicleType[] = ['ECONOMY', 'PREMIUM', 'XL', 'AUTO', 'BIKE', 'ANY'];
const PAYMENT_TYPES: PaymentMethodType[] = ['CARD', 'WALLET', 'UPI', 'CASH'];
const ACTIVE_STATUSES = ['REQUESTED', 'MATCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'RIDE_STARTED'];
const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'FAILED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED'];

export default function RiderDashboard() {
  const [tab, setTab] = useState<Tab>('profile');
  const qc = useQueryClient();

  // Socket always connected — must survive tab switches and page reloads
  const { joinRideRoom } = useRiderSocket(true, (payload) => {
    qc.setQueryData(['ride', 'active'], (old: Ride | undefined) =>
      old?.id === payload.rideId ? { ...old, status: payload.status as Ride['status'] } : old,
    );
    qc.setQueryData(['ride', payload.rideId], (old: Ride | undefined) =>
      old ? { ...old, status: payload.status as Ride['status'] } : old,
    );
    if (TERMINAL_STATUSES.includes(payload.status)) {
      void qc.invalidateQueries({ queryKey: ['ride', 'active'] });
      void qc.invalidateQueries({ queryKey: ['rider', 'history'] });
    }
  });

  const { data: activeRide } = useQuery({
    queryKey: ['ride', 'active'],
    queryFn: rideApi.getActiveRide,
    refetchInterval: 8000,
  });

  // Join socket room whenever active ride is known — works on page reload
  useEffect(() => {
    if (activeRide?.id) joinRideRoom(activeRide.id);
  }, [activeRide?.id, joinRideRoom]);

  // Auto-switch to active-ride tab on first load if there's a ride in progress
  const [autoSwitched, setAutoSwitched] = useState(false);
  useEffect(() => {
    if (!autoSwitched && activeRide && ACTIVE_STATUSES.includes(activeRide.status)) {
      setTab('active-ride');
      setAutoSwitched(true);
    }
  }, [activeRide, autoSwitched]);

  const hasActiveRide = !!activeRide && ACTIVE_STATUSES.includes(activeRide.status);

  const tabs: [Tab, string][] = [
    ['profile', 'Profile'],
    ['active-ride', hasActiveRide ? 'Active Ride ●' : 'Active Ride'],
    ['book', 'Book Ride'],
    ['payments', 'Payment Methods'],
    ['history', 'History'],
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'profile' && <ProfileTab />}
      {tab === 'active-ride' && (
        <ActiveRideTab
          ride={activeRide ?? null}
          onBookClick={() => setTab('book')}
        />
      )}
      {tab === 'book' && (
        <BookRideTab
          onBooked={() => {
            void qc.invalidateQueries({ queryKey: ['ride', 'active'] });
            setTab('active-ride');
          }}
        />
      )}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'history' && <HistoryTab />}
    </div>
  );
}

// ─── Status timeline ──────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { status: 'DRIVER_ASSIGNED',  label: 'Driver Assigned' },
  { status: 'DRIVER_ARRIVING',  label: 'Driver On the Way' },
  { status: 'DRIVER_ARRIVED',   label: 'Driver Arrived' },
  { status: 'RIDE_STARTED',     label: 'Ride in Progress' },
  { status: 'COMPLETED',        label: 'Ride Completed' },
];

// ─── Active Ride Tab ──────────────────────────────────────────────────────────

function ActiveRideTab({ ride, onBookClick }: { ride: Ride | null; onBookClick: () => void }) {
  const qc = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');

  const cancelMutation = useMutation({
    mutationFn: () => rideApi.cancelRide(ride!.id, cancelReason || 'Cancelled by rider'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ride', 'active'] }),
  });

  if (!ride || !ACTIVE_STATUSES.includes(ride.status)) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-10 text-center space-y-3">
        <p className="text-gray-600 font-medium">No active ride.</p>
        <p className="text-gray-400 text-sm">Completed rides appear in History.</p>
        <button onClick={onBookClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium">
          Book a Ride
        </button>
      </div>
    );
  }

  const currentIdx = TIMELINE_STEPS.findIndex(s => s.status === ride.status);
  const canCancel = ['REQUESTED', 'MATCHING'].includes(ride.status);
  const isCancellableTrip = ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING'].includes(ride.status);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Active Ride</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{ride.id}</p>
          </div>
          <StatusBadge status={ride.status} />
        </div>

        {/* Route + fare */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-green-500 font-bold mt-0.5">↑</span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pickup</p>
              <p className="text-gray-800">{ride.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-500 font-bold mt-0.5">↓</span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Drop</p>
              <p className="text-gray-800">{ride.dropAddress}</p>
            </div>
          </div>
          <div className="flex gap-6 pt-1 text-gray-600 border-t border-gray-200">
            <span><span className="text-gray-400">Vehicle:</span> {ride.vehicleType}</span>
            <span><span className="text-gray-400">Fare:</span> ₹{Number(ride.fareEstimate).toFixed(0)}</span>
            <span><span className="text-gray-400">Surge:</span> {ride.surgeMultiplier}x</span>
          </div>
        </div>

        {/* Status timeline */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Trip Progress</p>
          <div className="space-y-3">
            {(['REQUESTED', 'MATCHING'].includes(ride.status) || currentIdx === -1) && (
              <div className="flex items-center gap-3 text-sm text-blue-700 font-semibold">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs">→</div>
                <span>{ride.status === 'MATCHING' ? 'Searching for nearby driver...' : 'Waiting for matching...'}</span>
              </div>
            )}
            {TIMELINE_STEPS.map((step, i) => {
              const isDone = i < currentIdx;
              const isCurrent = i === currentIdx;
              const isPending = i > currentIdx && currentIdx >= 0;
              return (
                <div key={step.status} className={`flex items-center gap-3 text-sm
                  ${isPending ? 'text-gray-300' : isCurrent ? 'text-blue-700 font-semibold' : isDone ? 'text-gray-500' : 'text-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                    ${isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span>{step.label}</span>
                  {isCurrent && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Now</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancel */}
        {(canCancel || isCancellableTrip) && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="Cancellation reason (optional)"
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-red-500" />
            {cancelMutation.error && <ErrorAlert error={cancelMutation.error} />}
            <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Ride'}
            </button>
            {isCancellableTrip && (
              <p className="text-xs text-amber-600">Cancellation fee may apply (₹50) after driver has been assigned.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Book Ride Tab ────────────────────────────────────────────────────────────

function BookRideTab({ onBooked }: { onBooked: () => void }) {
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [form, setForm] = useState({
    pickupLat: 28.6139, pickupLng: 77.2090, pickupAddress: 'Connaught Place, New Delhi',
    dropLat: 28.7041, dropLng: 77.1025, dropAddress: 'IGI Airport, New Delhi',
    vehicleType: 'ECONOMY' as VehicleType,
  });

  const estimateMutation = useMutation({
    mutationFn: () => rideApi.fareEstimate({
      pickupLat: form.pickupLat, pickupLng: form.pickupLng,
      dropLat: form.dropLat, dropLng: form.dropLng,
      vehicleType: form.vehicleType,
    }),
    onSuccess: setEstimate,
  });

  const bookMutation = useMutation({
    mutationFn: () => rideApi.createRide({ ...form }),
    onSuccess: () => onBooked(),
  });

  const setNum = (k: 'pickupLat' | 'pickupLng' | 'dropLat' | 'dropLng') =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: parseFloat(e.target.value) || 0 }));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Request a Ride</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Pickup Lat</label>
          <input type="number" step="0.0001" value={form.pickupLat} onChange={setNum('pickupLat')}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Pickup Lng</label>
          <input type="number" step="0.0001" value={form.pickupLng} onChange={setNum('pickupLng')}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Pickup Address</label>
        <input value={form.pickupAddress} onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Drop Lat</label>
          <input type="number" step="0.0001" value={form.dropLat} onChange={setNum('dropLat')}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Drop Lng</label>
          <input type="number" step="0.0001" value={form.dropLng} onChange={setNum('dropLng')}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Drop Address</label>
        <input value={form.dropAddress} onChange={e => setForm(f => ({ ...f, dropAddress: e.target.value }))}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Type</label>
        <select value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value as VehicleType }))}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
          {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      {estimateMutation.error && <ErrorAlert error={estimateMutation.error} />}
      {estimate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-blue-900 text-base mb-2">
            Estimated Fare: ₹{estimate.total} {estimate.currency}
          </p>
          <div className="grid grid-cols-3 gap-2 text-blue-700">
            <span>{estimate.distanceKm} km</span>
            <span>Base: ₹{estimate.basefare}</span>
            <span>Surge: {estimate.surgeMultiplier}x</span>
          </div>
        </div>
      )}

      {bookMutation.error && <ErrorAlert error={bookMutation.error} />}
      <div className="flex gap-2">
        <button onClick={() => estimateMutation.mutate()} disabled={estimateMutation.isPending}
          className="flex-1 border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium transition-colors">
          {estimateMutation.isPending ? 'Estimating...' : 'Get Estimate'}
        </button>
        <button onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
          {bookMutation.isPending ? 'Booking...' : 'Book Ride'}
        </button>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['rider', 'profile'],
    queryFn: riderApi.getProfile,
  });
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', defaultVehicleType: 'ECONOMY' as VehicleType });

  const update = useMutation({
    mutationFn: riderApi.updateProfile,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['rider'] }); setEdit(false); },
  });

  if (isLoading) return <p className="text-gray-500 text-sm">Loading profile...</p>;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user?.email}</h2>
            <p className="text-sm text-gray-500">Rider Profile</p>
          </div>
          <button onClick={() => { setEdit(!edit); setForm({ name: '', phone: '', defaultVehicleType: profile?.preferences.defaultVehicleType ?? 'ECONOMY' }); }}
            className="text-sm text-blue-600 hover:underline">{edit ? 'Cancel' : 'Edit'}</button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><p className="text-gray-500">Rating</p><p className="font-semibold text-lg">{profile?.rating ?? '-'} ★</p></div>
          <div><p className="text-gray-500">Total Rides</p><p className="font-semibold text-lg">{profile?.totalRides ?? 0}</p></div>
          <div><p className="text-gray-500">Preferred Vehicle</p><p className="font-semibold">{profile?.preferences.defaultVehicleType ?? '-'}</p></div>
        </div>
      </div>

      {edit && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Edit Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+919876543210"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Vehicle Type</label>
              <select value={form.defaultVehicleType} onChange={e => setForm(f => ({ ...f, defaultVehicleType: e.target.value as VehicleType }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            {update.error && <ErrorAlert error={update.error} />}
            <button onClick={() => update.mutate({ ...(form.name && { name: form.name }), ...(form.phone && { phone: form.phone }), defaultVehicleType: form.defaultVehicleType })}
              disabled={update.isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
              {update.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

function PaymentsTab() {
  const qc = useQueryClient();
  const { data: methods, isLoading, error } = useQuery({
    queryKey: ['rider', 'payments'],
    queryFn: riderApi.getPaymentMethods,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'CARD' as PaymentMethodType, provider: '', maskedDetails: '' });

  const addMutation = useMutation({
    mutationFn: () => riderApi.addPaymentMethod({ type: form.type, ...(form.provider && { provider: form.provider }), ...(form.maskedDetails && { maskedDetails: form.maskedDetails }) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['rider', 'payments'] }); setShowAdd(false); },
  });

  const defaultMutation = useMutation({
    mutationFn: riderApi.setDefaultPaymentMethod,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rider', 'payments'] }),
  });

  if (isLoading) return <p className="text-gray-500 text-sm">Loading...</p>;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-900">Payment Methods</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium">
          {showAdd ? 'Cancel' : '+ Add Method'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PaymentMethodType }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
              {PAYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Provider (optional)</label>
            <input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
              placeholder="Visa, MasterCard, PhonePe..."
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Masked Details (optional)</label>
            <input value={form.maskedDetails} onChange={e => setForm(f => ({ ...f, maskedDetails: e.target.value }))}
              placeholder="**** 4242"
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {addMutation.error && <ErrorAlert error={addMutation.error} />}
          <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
            {addMutation.isPending ? 'Adding...' : 'Add Method'}
          </button>
        </div>
      )}

      {(methods ?? []).length === 0
        ? <p className="text-gray-500 text-sm">No payment methods added yet.</p>
        : (methods ?? []).map(m => (
          <div key={m.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{m.type}</span>
                {m.provider && <span className="text-gray-500 text-sm">{m.provider}</span>}
                {m.maskedDetails && <span className="text-gray-400 text-xs font-mono">{m.maskedDetails}</span>}
                {m.isDefault && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Default</span>}
              </div>
            </div>
            {!m.isDefault && (
              <button onClick={() => defaultMutation.mutate(m.id)} disabled={defaultMutation.isPending}
                className="text-xs text-blue-600 hover:underline">Set Default</button>
            )}
          </div>
        ))
      }
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ['rider', 'history', page],
    queryFn: () => riderApi.getRideHistory(page),
  });

  if (isLoading) return <p className="text-gray-500 text-sm">Loading...</p>;
  if (error) return <ErrorAlert error={error} />;

  const rides = data?.data ?? [];

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-900">Ride History ({data?.total ?? 0} total)</h2>
      {rides.length === 0 ? (
        <p className="text-gray-500 text-sm">No completed rides yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="py-2 pr-4">Route</th>
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Fare</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {rides.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4">
                    <p className="font-medium">{r.pickupAddress}</p>
                    <p className="text-gray-400">→ {r.dropAddress}</p>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{r.vehicleType}</td>
                  <td className="py-2 pr-4"><StatusBadge status={r.status} /></td>
                  <td className="py-2 pr-4">₹{Number(r.fareEstimate).toFixed(0)}</td>
                  <td className="py-2 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center gap-3 text-sm">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
        <span className="text-gray-600">Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={rides.length < 20}
          className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '../api/driver';
import { tripApi } from '../api/trip';
import { useAuth } from '../context/AuthContext';
import { useDriverSocket } from '../hooks/useDriverSocket';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import type { VehicleType } from '../types';

type Tab = 'profile' | 'vehicles' | 'availability' | 'active-trip' | 'history';
const VEHICLE_TYPES: VehicleType[] = ['ECONOMY', 'PREMIUM', 'XL', 'AUTO', 'BIKE', 'ANY'];

export default function DriverDashboard() {
  const [tab, setTab] = useState<Tab>('profile');
  const [secsLeft, setSecsLeft] = useState(0);
  const qc = useQueryClient();

  const { data: profile } = useQuery({ queryKey: ['driver', 'profile'], queryFn: driverApi.getProfile });
  const isOnline = profile?.status === 'AVAILABLE' || profile?.status === 'ON_TRIP';

  const { offer, connected, respondToOffer, updateLocation } = useDriverSocket(
    isOnline,
    (trip) => {
      qc.setQueryData(['driver', 'active-trip'], trip);
      setTab('active-trip');
    },
    () => {
      qc.setQueryData(['driver', 'active-trip'], undefined);
      void qc.invalidateQueries({ queryKey: ['driver', 'profile'] });
      setTab('profile');
    },
  );

  useEffect(() => {
    if (!offer) return;
    const tick = () => setSecsLeft(Math.max(0, Math.ceil((offer.expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offer]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Socket connection status */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-gray-400' : connected ? 'bg-green-500' : 'bg-yellow-400'}`} />
        <span className="text-xs text-gray-500">
          {!isOnline ? 'Offline' : connected ? 'Live — receiving ride offers' : 'Connecting...'}
        </span>
      </div>

      {/* Ride offer banner — appears on top regardless of active tab */}
      {offer && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-semibold text-amber-900 text-base">New Ride Request</p>
              <p className="text-sm text-amber-800">{offer.pickupAddress}</p>
              <p className="text-sm text-amber-600">→ {offer.dropAddress}</p>
              <div className="flex gap-3 text-sm text-amber-700 mt-1">
                <span>₹{offer.fareEstimate}</span>
                <span>·</span>
                <span>{offer.vehicleType}</span>
                <span>·</span>
                <span className={secsLeft <= 3 ? 'text-red-600 font-semibold' : ''}>
                  {secsLeft}s
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => respondToOffer(offer.rideId, true)}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-medium text-sm"
              >
                Accept
              </button>
              <button
                onClick={() => respondToOffer(offer.rideId, false)}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded font-medium text-sm"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
        {([['profile','Profile'],['vehicles','Vehicles'],['availability','Availability'],['active-trip','Active Trip'],['history','Trip History']] as [Tab,string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'vehicles' && <VehiclesTab />}
      {tab === 'availability' && <AvailabilityTab onUpdateLocation={updateLocation} />}
      {tab === 'active-trip' && <ActiveTripTab />}
      {tab === 'history' && <HistoryTab />}
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading, error } = useQuery({ queryKey: ['driver','profile'], queryFn: driverApi.getProfile });
  const { data: earnings } = useQuery({ queryKey: ['driver','earnings'], queryFn: driverApi.getEarnings });
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });

  const update = useMutation({
    mutationFn: driverApi.updateProfile,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['driver'] }); setEdit(false); },
  });

  if (isLoading) return <p className="text-gray-500 text-sm">Loading...</p>;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user?.email}</h2>
            <p className="text-sm text-gray-500">Driver Profile</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={profile?.status ?? 'OFFLINE'} />
            <button onClick={() => setEdit(!edit)} className="text-sm text-blue-600 hover:underline">{edit ? 'Cancel' : 'Edit'}</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
          <div><p className="text-gray-500">Rating</p><p className="font-semibold text-lg">{profile?.rating ?? '-'} ★</p></div>
          <div><p className="text-gray-500">Total Trips</p><p className="font-semibold text-lg">{profile?.totalTrips ?? 0}</p></div>
          <div><p className="text-gray-500">Earnings</p><p className="font-semibold text-lg">₹{earnings?.totalEarnings ?? 0}</p></div>
        </div>
      </div>

      {edit && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
          <h3 className="font-medium text-gray-900">Edit Profile</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Full name"
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+919876543210"
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {update.error && <ErrorAlert error={update.error} />}
          <button onClick={() => update.mutate({ ...(form.name && { name: form.name }), ...(form.phone && { phone: form.phone }) })}
            disabled={update.isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
            {update.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

function VehiclesTab() {
  const qc = useQueryClient();
  const { data: vehicles, isLoading, error } = useQuery({ queryKey: ['driver','vehicles'], queryFn: driverApi.getVehicles });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ make: '', model: '', year: 2022, licensePlate: '', type: 'ECONOMY' as VehicleType, color: '' });

  const addMutation = useMutation({
    mutationFn: () => driverApi.addVehicle({ ...form, ...(form.color && { color: form.color }) }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['driver','vehicles'] }); setShowAdd(false); },
  });

  if (isLoading) return <p className="text-gray-500 text-sm">Loading...</p>;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-900">Vehicles</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium">
          {showAdd ? 'Cancel' : '+ Add Vehicle'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="v-make" className="block text-xs font-medium text-gray-600 mb-1">Make</label>
              <input id="v-make" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))}
                placeholder="Toyota"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="v-model" className="block text-xs font-medium text-gray-600 mb-1">Model</label>
              <input id="v-model" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                placeholder="Innova Crysta"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="v-year" className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <input id="v-year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number.parseInt(e.target.value) || 2022 }))}
                min={2000} max={2025}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="v-plate" className="block text-xs font-medium text-gray-600 mb-1">License Plate</label>
              <input id="v-plate" value={form.licensePlate} onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value }))}
                placeholder="DL01AB1234"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="v-type" className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select id="v-type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as VehicleType }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="v-color" className="block text-xs font-medium text-gray-600 mb-1">Color (optional)</label>
              <input id="v-color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                placeholder="White"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {addMutation.error && <ErrorAlert error={addMutation.error} />}
          <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
            {addMutation.isPending ? 'Adding...' : 'Add Vehicle'}
          </button>
        </div>
      )}

      {(vehicles ?? []).length === 0
        ? <p className="text-gray-500 text-sm">No vehicles registered yet.</p>
        : (vehicles ?? []).map(v => (
          <div key={v.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{v.make} {v.model} ({v.year})</p>
              <p className="text-gray-500 text-xs">{v.licensePlate} · {v.type} {v.color ? `· ${v.color}` : ''}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {v.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))
      }
    </div>
  );
}

function AvailabilityTab({ onUpdateLocation }: Readonly<{ onUpdateLocation: (lat: number, lng: number) => void }>) {
  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['driver','profile'], queryFn: driverApi.getProfile });
  const { data: vehicles } = useQuery({ queryKey: ['driver','vehicles'], queryFn: driverApi.getVehicles });
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.209);
  const [vehicleId, setVehicleId] = useState('');
  const [locationSynced, setLocationSynced] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Refs always hold latest lat/lng so the interval closure never goes stale
  const latRef = useRef(lat);
  const lngRef = useRef(lng);
  latRef.current = lat;
  lngRef.current = lng;

  useEffect(() => {
    if (profile && !locationSynced) {
      if (profile.lastLocationLat != null) setLat(Number(profile.lastLocationLat));
      if (profile.lastLocationLng != null) setLng(Number(profile.lastLocationLng));
      setLocationSynced(true);
    }
  }, [profile, locationSynced]);

  // Auto-simulate: drift ±0.0002° (~22m) per tick — realistic city-speed movement
  useEffect(() => {
    if (!simulating) return;
    const id = setInterval(() => {
      const newLat = Number.parseFloat((latRef.current + (Math.random() - 0.5) * 0.0004).toFixed(6));
      const newLng = Number.parseFloat((lngRef.current + (Math.random() - 0.5) * 0.0004).toFixed(6));
      setLat(newLat);
      setLng(newLng);
      onUpdateLocation(newLat, newLng);
    }, 2000);
    return () => clearInterval(id);
  }, [simulating, onUpdateLocation]);

  const availMutation = useMutation({
    mutationFn: (status: 'AVAILABLE' | 'OFFLINE') =>
      driverApi.setAvailability({ status, ...(status === 'AVAILABLE' && { lat, lng, vehicleId: vehicleId || undefined }) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['driver','profile'] }),
  });

  const isOnline = profile?.status === 'AVAILABLE' || profile?.status === 'ON_TRIP';

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Driver Status</h2>
          <StatusBadge status={profile?.status ?? 'OFFLINE'} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="a-lat" className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
            <input id="a-lat" type="number" step="0.0001" value={lat} onChange={e => setLat(Number.parseFloat(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="a-lng" className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
            <input id="a-lng" type="number" step="0.0001" value={lng} onChange={e => setLng(Number.parseFloat(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {!isOnline && (
          <div className="mb-4">
            <label htmlFor="a-vehicle" className="block text-xs font-medium text-gray-600 mb-1">Vehicle</label>
            <select id="a-vehicle" value={vehicleId} onChange={e => setVehicleId(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select vehicle</option>
              {(vehicles ?? []).map(v => (
                <option key={v.id} value={v.id}>{v.make} {v.model} — {v.licensePlate}</option>
              ))}
            </select>
          </div>
        )}

        {availMutation.error && <ErrorAlert error={availMutation.error} />}
        <div className="flex flex-wrap gap-2">
          {!isOnline && (
            <button onClick={() => availMutation.mutate('AVAILABLE')} disabled={availMutation.isPending}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
              {availMutation.isPending ? '...' : 'Go Online'}
            </button>
          )}
          {isOnline && (
            <button onClick={() => availMutation.mutate('OFFLINE')} disabled={availMutation.isPending}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
              {availMutation.isPending ? '...' : 'Go Offline'}
            </button>
          )}
          <button onClick={() => onUpdateLocation(lat, lng)}
            className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium text-gray-700">
            Send Location
          </button>
          <button
            onClick={() => setSimulating(s => !s)}
            className={`px-4 py-2 rounded text-sm font-medium border ${simulating ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            {simulating ? 'Stop Simulate' : 'Simulate (0.5/sec)'}
          </button>
          {simulating && <span className="text-blue-600 text-xs self-center animate-pulse">● Sending every 2s via WebSocket</span>}
        </div>
      </div>
    </div>
  );
}

function ActiveTripTab() {
  const qc = useQueryClient();
  const [cancelReason, setCancelReason] = useState('');

  // No refetchInterval — driver triggers all state changes via HTTP;
  // invalidate() after each mutation keeps data fresh
  const { data: trip, isLoading, error } = useQuery({
    queryKey: ['driver','active-trip'],
    queryFn: tripApi.getActiveTrip,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['driver','active-trip'] });

  const arrivingMutation = useMutation({ mutationFn: () => tripApi.driverArriving(trip!.id), onSuccess: invalidate });
  const arrivedMutation  = useMutation({ mutationFn: () => tripApi.driverArrived(trip!.id),  onSuccess: invalidate });
  const startMutation    = useMutation({ mutationFn: () => tripApi.startTrip(trip!.id),       onSuccess: invalidate });
  const completeMutation = useMutation({ mutationFn: () => tripApi.completeTrip(trip!.id),    onSuccess: invalidate });
  const cancelMutation   = useMutation({ mutationFn: () => tripApi.cancelTrip(trip!.id, cancelReason || undefined), onSuccess: invalidate });

  if (isLoading) return <p className="text-gray-500 text-sm">Loading...</p>;
  if (error) return <ErrorAlert error={error} />;

  if (!trip) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">No active trip</p>
        <p className="text-gray-400 text-sm mt-1">Go online to receive ride offers.</p>
      </div>
    );
  }

  const anyError = arrivingMutation.error ?? arrivedMutation.error ?? startMutation.error ?? completeMutation.error ?? cancelMutation.error;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Active Trip</h3>
          <p className="text-xs text-gray-400 font-mono">{trip.id}</p>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
        <div><span className="text-gray-400">Ride ID:</span> <span className="font-mono text-xs">{trip.rideId}</span></div>
        {trip.finalFare != null && <div><span className="text-gray-400">Fare:</span> ₹{trip.finalFare}</div>}
        {trip.startedAt && <div><span className="text-gray-400">Started:</span> {new Date(trip.startedAt).toLocaleTimeString()}</div>}
      </div>

      {anyError && <ErrorAlert error={anyError} />}

      <div className="flex flex-wrap gap-2">
        {trip.status === 'DRIVER_ASSIGNED' && (
          <button onClick={() => arrivingMutation.mutate()} disabled={arrivingMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
            {arrivingMutation.isPending ? '...' : "I'm on the way"}
          </button>
        )}
        {trip.status === 'DRIVER_ARRIVING' && (
          <button onClick={() => arrivedMutation.mutate()} disabled={arrivedMutation.isPending}
            className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
            {arrivedMutation.isPending ? '...' : "I've Arrived"}
          </button>
        )}
        {trip.status === 'DRIVER_ARRIVED' && (
          <button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
            {startMutation.isPending ? '...' : 'Start Ride'}
          </button>
        )}
        {trip.status === 'RIDE_STARTED' && (
          <button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium">
            {completeMutation.isPending ? '...' : 'Complete Trip'}
          </button>
        )}
        {!['COMPLETED','CANCELLED','FAILED','PAYMENT_PENDING','PAYMENT_COMPLETED'].includes(trip.status) && (
          <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}
            className="border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium">
            Cancel
          </button>
        )}
      </div>

      {!['COMPLETED','CANCELLED','FAILED','PAYMENT_PENDING','PAYMENT_COMPLETED'].includes(trip.status) && (
        <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
          placeholder="Cancel reason (optional)"
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-red-500" />
      )}
    </div>
  );
}

function HistoryTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ['driver', 'history', page],
    queryFn: () => driverApi.getTripHistory(page),
  });

  if (isLoading) return <p className="text-gray-500 text-sm">Loading...</p>;
  if (error) return <ErrorAlert error={error} />;

  const trips = data?.data ?? [];

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-900">Trip History ({data?.total ?? 0} total)</h2>
      {trips.length === 0 ? (
        <p className="text-gray-500 text-sm">No completed trips yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Fare</th>
              <th className="py-2 pr-4 font-medium">Duration</th>
              <th className="py-2 pr-4 font-medium">Distance</th>
              <th className="py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id} className="border-b border-gray-100">
                <td className="py-2 pr-4"><StatusBadge status={t.status} /></td>
                <td className="py-2 pr-4">{t.finalFare == null ? '—' : `₹${t.finalFare}`}</td>
                <td className="py-2 pr-4">{t.durationSecs == null ? '—' : `${Math.floor(t.durationSecs / 60)}m`}</td>
                <td className="py-2 pr-4">{t.distanceKm == null ? '—' : `${t.distanceKm} km`}</td>
                <td className="py-2">{new Date(t.completedAt ?? t.startedAt ?? t.rideId).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex items-center gap-3 text-sm">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
        <span className="text-gray-600">Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={trips.length < 20}
          className="px-3 py-1.5 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
      </div>
    </div>
  );
}

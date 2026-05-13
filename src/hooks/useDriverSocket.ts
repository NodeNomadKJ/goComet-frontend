import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { Trip } from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

// Produces a 1.2s phone-ring burst (440 Hz + 480 Hz — US telephone ring standard).
// Called every 2000ms → 1.2s ring + 0.8s silence = classic phone cadence.
function playRingBurst() {
  try {
    const ctx = new AudioContext();
    const duration = 1.2;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.04);
    masterGain.gain.setValueAtTime(0.35, ctx.currentTime + duration - 0.08);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    [440, 480].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    });

    setTimeout(() => ctx.close(), (duration + 0.2) * 1000);
  } catch {
    // AudioContext blocked before first user gesture — silent fail
  }
}

export interface RideOffer {
  rideId: string;
  riderId: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropAddress: string;
  fareEstimate: number;
  vehicleType: string;
  expiresAt: number;  // epoch ms
}

export function useDriverSocket(onTripAssigned: (trip: Trip) => void) {
  const socketRef = useRef<Socket | null>(null);
  const tripAssignedCbRef = useRef(onTripAssigned);
  tripAssignedCbRef.current = onTripAssigned;

  const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [offer, setOffer] = useState<RideOffer | null>(null);
  const [connected, setConnected] = useState(false);

  const stopRinging = useCallback(() => {
    if (soundIntervalRef.current !== null) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
  }, []);

  const startRinging = useCallback(() => {
    stopRinging();
    playRingBurst();
    soundIntervalRef.current = setInterval(playRingBurst, 2000);
  }, [stopRinging]);

  useEffect(() => {
    const socket = io(`${BASE_URL}/driver`, {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('ride:offer', (payload: RideOffer) => {
      startRinging();
      setOffer(payload);
    });

    // Backend emits this after the trip row is committed — guaranteed to have data.
    // Using this instead of invalidateQueries avoids the race where the query fires
    // before the trip exists in the DB.
    socket.on('trip:assigned', (trip: Trip) => {
      stopRinging();
      setOffer(null);
      tripAssignedCbRef.current(trip);
    });

    socket.on('connect_error', (err) => {
      console.error('[DriverSocket] connect error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [startRinging, stopRinging]);

  // Auto-dismiss offer when it expires — also stops the ring
  useEffect(() => {
    if (!offer) return;
    const remaining = offer.expiresAt - Date.now();
    if (remaining <= 0) { stopRinging(); setOffer(null); return; }
    const timer = setTimeout(() => { stopRinging(); setOffer(null); }, remaining);
    return () => { clearTimeout(timer); stopRinging(); };
  }, [offer, stopRinging]);

  const respondToOffer = useCallback((rideId: string, accepted: boolean) => {
    stopRinging();
    socketRef.current?.emit('offer:response', { rideId, accepted });
    if (!accepted) setOffer(null);
    // For accepted: keep offer visible until trip:assigned arrives confirming the trip was created.
    // trip:assigned handler will clear the offer and call the callback.
  }, [stopRinging]);

  const updateLocation = useCallback((lat: number, lng: number) => {
    socketRef.current?.emit('location:update', { lat, lng });
  }, []);

  return { offer, connected, respondToOffer, updateLocation };
}

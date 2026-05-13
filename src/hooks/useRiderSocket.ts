import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export interface RideStatusPayload {
  rideId: string;
  status: string;
  driverId?: string;
}

export function useRiderSocket(
  enabled: boolean,
  onRideStatus: (payload: RideStatusPayload) => void,
) {
  const socketRef = useRef<Socket | null>(null);
  // Use a ref so the callback is always current without re-triggering the effect
  const cbRef = useRef(onRideStatus);
  cbRef.current = onRideStatus;

  useEffect(() => {
    if (!enabled) return;

    const socket = io(`${BASE_URL}/rider`, {
      withCredentials: true,   // sends HttpOnly access_token cookie
    });
    socketRef.current = socket;

    socket.on('ride:status', (payload: RideStatusPayload) => {
      cbRef.current(payload);
    });

    socket.on('connect_error', (err) => {
      console.error('[RiderSocket] connect error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  const joinRideRoom = useCallback((rideId: string) => {
    const socket = socketRef.current;
    if (!socket) return;
    if (socket.connected) {
      socket.emit('join:ride', { rideId });
    } else {
      // Socket is still connecting — emit after handshake completes
      socket.once('connect', () => socket.emit('join:ride', { rideId }));
    }
  }, []);

  return { joinRideRoom };
}

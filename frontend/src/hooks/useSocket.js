import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { grayscaleByInstance } from '../utils/colorMixer';

function getBackendUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('server')) return params.get('server');
  // Dev: VITE_BACKEND_URL=http://localhost:3001
  // Prod: VITE_BACKEND_URL is empty → connect to current origin (ALB URL)
  //       Nginx on each EC2 then proxies /api and /socket.io to localhost:3001
  return import.meta.env.VITE_BACKEND_URL || window.location.origin;
}

export function useSocket() {
  const socketRef = useRef(null);
  const backendUrl = getBackendUrl();
  const [isConnected, setIsConnected] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [pixels, setPixels] = useState({});
  const [stormActive, setStormActive] = useState(false);
  const [instances, setInstances] = useState({});

  useEffect(() => {
    // WebSocket-only: skips HTTP polling handshake so nginx can round-robin
    // each new connection independently (polling causes session-ID mismatch across backends)
    const socket = io(backendUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('server:info', (info) => {
      setServerInfo(info);
      setInstances((prev) => ({
        ...prev,
        [info.instanceId]: { color: info.color, active: true },
      }));
    });

    socket.on('pixels:init', (pixelMap) => {
      setPixels(pixelMap);
    });

    socket.on('pixel:update', (data) => {
      if (data.type === 'GRAYSCALE') {
        setPixels((prev) => grayscaleByInstance(prev, data.instanceId));
        setInstances((prev) => ({
          ...prev,
          [data.instanceId]: { ...prev[data.instanceId], active: false },
        }));
      } else {
        const key = `${data.x}:${data.y}`;
        setPixels((prev) => ({ ...prev, [key]: data }));
      }
    });

    socket.on('storm:status', ({ active }) => {
      setStormActive(active);
    });

    socket.on('instance:activity', ({ instanceId, color }) => {
      setInstances((prev) => ({
        ...prev,
        [instanceId]: { color, active: true },
      }));
    });

    socket.on('instance:leave', ({ instanceId }) => {
      setInstances((prev) => ({
        ...prev,
        [instanceId]: { ...prev[instanceId], active: false },
      }));
    });

    return () => socket.disconnect();
  }, []);

  function placePixel(x, y) {
    socketRef.current?.emit('pixel:place', { x, y });
  }

  function startStorm() {
    socketRef.current?.emit('storm:start');
  }

  function stopStorm() {
    socketRef.current?.emit('storm:stop');
  }

  return { isConnected, serverInfo, pixels, stormActive, instances, placePixel, startStorm, stopStorm, backendUrl };
}

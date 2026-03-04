import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      socketRef.current.emit('watch_hospitals');
    });

    socketRef.current.on('disconnect', () => setConnected(false));

    socketRef.current.on('bed_count_update', (data) => {
      setLastUpdate({ ...data, timestamp: Date.now() });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const joinHospital = (hospitalId) => {
    if (socketRef.current) socketRef.current.emit('join_hospital', hospitalId);
  };

  const joinCity = (cityName) => {
    if (socketRef.current) socketRef.current.emit('join_city', cityName);
  };

  const on = (event, callback) => {
    if (socketRef.current) socketRef.current.on(event, callback);
  };

  const off = (event, callback) => {
    if (socketRef.current) socketRef.current.off(event, callback);
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, lastUpdate, joinHospital, joinCity, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(process.env.REACT_APP_API_URL?.replace('/api','') || 'http://localhost:5001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => { setConnected(true); });
    s.on('disconnect', () => { setConnected(false); });
    setSocket(s);

    return () => { s.disconnect(); };
  }, []);

  const joinHospital = (hospitalId) => { if (socket) socket.emit('join_hospital', hospitalId); };
  const joinCity = (cityId) => { if (socket) socket.emit('join_city', cityId); };

  return (
    <SocketContext.Provider value={{ socket, connected, joinHospital, joinCity }}>
      {children}
    </SocketContext.Provider>
  );
};

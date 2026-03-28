import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!user || !token) {
      setIsConnected(false);
      setSocket((currentSocket) => {
        currentSocket?.disconnect();
        return null;
      });
      return undefined;
    }

    const nextSocket = io(getSocketUrl(), {
      autoConnect: true,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    nextSocket.on('connect', handleConnect);
    nextSocket.on('disconnect', handleDisconnect);

    setSocket(nextSocket);

    return () => {
      nextSocket.off('connect', handleConnect);
      nextSocket.off('disconnect', handleDisconnect);
      nextSocket.disconnect();
      setIsConnected(false);
      setSocket(null);
    };
  }, [user?._id]);

  const value = useMemo(() => ({
    socket,
    isConnected,
  }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

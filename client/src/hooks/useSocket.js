import { useContext, useEffect, useCallback } from 'react';
import { SocketContext } from '../context/SocketContext';

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};

export const useSocketEvent = (eventName, callback) => {
  const { socket } = useSocket();

  const stableCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (!socket) return;
    socket.on(eventName, stableCallback);
    return () => {
      socket.off(eventName, stableCallback);
    };
  }, [socket, eventName, stableCallback]);
};

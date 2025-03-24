import React, { useEffect } from 'react';
import Lobby from './Lobby';
import { useGameStore } from '../store/useGameStore';

export default function App() {
  const initSocket = useGameStore(state => state.initSocket)
  const disconnectSocket = useGameStore(state => state.disconnectSocket)
  
  useEffect(() => {
    initSocket()
    return () => {disconnectSocket()}
  }, [initSocket, disconnectSocket])
  
  return (
    <Lobby />
  )
}
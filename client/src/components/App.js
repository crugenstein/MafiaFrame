import React, { useState, useRef } from 'react';
import Lobby from './Lobby';
import { SocketProvider } from '../contexts/SocketContext';

function App() {
  return (
    <Lobby />
  );
}

export default function AppWrapper() {
  return (
    <SocketProvider>
        <App />
    </SocketProvider>
  );
}
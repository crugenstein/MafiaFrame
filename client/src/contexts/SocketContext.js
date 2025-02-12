import { createContext, useContext, useEffect, useState } from "react";
import { io } from 'socket.io-client'

const SocketContext = createContext(null)
const SOCKET_URL = "http://localhost:5000"

export const useSocket = () => {
    return useContext(SocketContext)
}

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null)

    useEffect(() => { // WHEN SOCKETPROVIDER MOUNTS
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket"]
        })
        setSocket(newSocket)
        return () => { // CLEANUP WHEN SOCKETPROVIDER UNMOUNTS
            newSocket.disconnect()
        }
    }, [])

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}
import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

export default function NotificationPanel() {
    const socket = useSocket();
    const [notifications, setNotifications] = useState([]);

    useEffect (() => {

        const recieveNotif = (newNotification) => {
            setNotifications(prevNotifications => [...prevNotifications, newNotification]);
        }

        socket.on('RECIEVE_NOTIF', recieveNotif);


    }, [socket]);

    return (
        <div>
            {notifications.map((notification, index) => (
                <div key={index}>
                    {notification.time + ": " + notification.text}
                </div>
            ))}
        </div>
    )

}
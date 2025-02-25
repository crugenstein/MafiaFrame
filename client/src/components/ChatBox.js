import React, { useState, useRef, useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function ChatBox({ chatId }) {
    const socket = useSocket()
    const [messages, setMessages] = useState([])
    const messageBoxRef = useRef()

    useEffect(() => {

        const receiveMessage = ({ sender, contents, receivingChatId }) => { // client got a message
            if (chatId !== receivingChatId) return;
            const newMessage = {sender, contents}
            setMessages(prevMessages => [...prevMessages, newMessage])
        }

        const fetchMessages = async () => {
            try {
                const response = await fetch(`http://localhost:5000/chatMessages/${chatId}?socketId=${socket.id}`)
                if (response.ok) {
                    const messageList = await response.json()
                    setMessages(messageList)
                } else {
                    const errorData = await response.json()
                    console.error(errorData.error)
                }
            } catch (err) {
                console.log("Error fetching chat messages", err)
            }
        }

        fetchMessages()

        socket.on('receive_message', receiveMessage)

        return () => { // When lobby unmounts
            socket.off('receive_message', receiveMessage)
        };

    }, [socket])

    function handleMessageSubmit(e) { // When player clicks "send" in lobby chat
        e.preventDefault()
        if (!socket) {
            console.log("Player tried to send message with no socket!")
            return
        }
        const senderSocket = socket
        const contents = messageBoxRef.current.value.trim()
        socket.emit('send_message', { senderSocket, contents, chatId })
    }

    return (
        <div className="container mt-3">
            <div className="card shadow-lg">
                <div className="card-header bg-dark text-white text-center">
                    <h5 className="mb-0">Chat: {chatId}</h5>
                </div>

                <div style={{ width: '100%', height: '300px', overflowY: 'auto', border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
                    {messages.map((msg, index) => (
                        <div key={index} style={{
                            marginBottom: '5px',
                            backgroundColor: msg.sender === '[SERVER]' ? 'yellow' : (index % 2 === 0 ? 'lightgray' : 'darkgray'), // Conditional background
                            padding: '5px', // Padding for better text spacing
                            borderRadius: '5px' // Rounded corners for styling
                        }}>
                            {msg.sender + ": " + msg.contents}
                        </div>
                    ))}
                </div>

                <div className="card-footer">
                    <form onSubmit={handleMessageSubmit} className="d-flex">
                        <input 
                            type="text" 
                            ref={messageBoxRef} 
                            className="form-control me-2" 
                            placeholder="Type a message..." 
                            required 
                        />
                        <button type="submit" className="btn btn-dark">Send</button>
                    </form>
                </div>
            </div>
        </div>
    )

}
import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function ChatBox({ chatId }) {
    const chat = useGameStore(state => state.sharedChats.get(chatId))
    const emit = useGameStore(state => state.emit)
    const [message, setMessage] = useState('')

    const sendMessage = (e) => {
        e.preventDefault()
        if (!message.trim()) return
        emit('CLICK_SEND_MESSAGE', {contents: message, chatId})
        setMessage('')
    }

    return (
        <div className="container mt-3">
            <div className="card shadow-lg">
                <div className="card-header bg-dark text-white text-center">
                    <h5 className="mb-0">{chat?.name}</h5>
                </div>

                <div style={{ width: '100%', height: '300px', overflowY: 'auto', border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
                    {chat.messages.map((msg, index) => (
                        <div key={index} style={{
                            marginBottom: '5px',
                            backgroundColor: msg.sender === '[SERVER]' ? 'yellow' : (index % 2 === 0 ? 'lightgray' : 'darkgray'),
                            padding: '5px',
                            borderRadius: '5px'
                        }}>
                            {msg.sender + ": " + msg.contents}
                        </div>
                    ))}
                </div>

                <div className="card-footer">
                    <form onSubmit={sendMessage} className="d-flex">
                        <input 
                            type="text" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
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
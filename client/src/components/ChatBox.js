import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function ChatBox({ chatId }) {
    const chat = useGameStore(state => state.sharedChats.get(chatId))
    const messages = useGameStore(state => state.sharedChats.get(chatId)?.messages)
    const emit = useGameStore(state => state.emit)
    const [message, setMessage] = useState('')

    const sendMessage = (e) => {
        e.preventDefault()
        if (!message.trim()) return
        emit('CLICK_SEND_MESSAGE', {contents: message, chatId})
        setMessage('')
    }

    console.log(chatId)
    console.log(chat)

    if (!chat) {
        return <div>The chat Id was {chatId}.</div>
    }

    return (
        <div className="container mt-3">
            <div style={{height: '90vh'}} className="card shadow-lg">
                <div className="card-header bg-dark text-white text-center">
                    <h5 className="mb-0">{chat?.name}</h5>
                </div>

                <div style={{ width: '100%', height: '100%', overflowY: 'auto', border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
                    {messages.map((msg, index) => (
                        <div key={index} style={{
                            marginBottom: '5px',
                            backgroundColor: msg.senderName === '[SERVER]' ? 'yellow' : (index % 2 === 0 ? 'lightgray' : 'darkgray'),
                            padding: '5px',
                            borderRadius: '5px'
                        }}>
                            {msg.senderName + ": " + msg.contents}
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
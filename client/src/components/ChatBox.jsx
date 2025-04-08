import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore'

export default function ChatBox({ chatId }) {
    const chat = useGameStore(state => state.sharedChats.get(chatId))
    const messages = useGameStore(state => state.sharedChats.get(chatId)?.messages)
    const emit = useGameStore(state => state.emit)
    const username = useGameStore(state => state.username)
    const [message, setMessage] = useState('')

    const sendMessage = (e) => {
        e.preventDefault()
        if (!message.trim()) return
        emit('CLICK_SEND_MESSAGE', {contents: message, chatId})
        setMessage('')
    }

    if (!chat) {
        return <div>Critical error! The chat ID was {chatId}.</div>
    }

    return (
        <div className="h-full flex flex-col rounded-xl backdrop-blur-lg bg-white/10 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 text-white text-center py-2 px-4">
            <h5 className="text-lg font-semibold truncate">{chat?.name /*  TODO make this look less buttony */}</h5>
          </div>
      
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.map((msg, index) => {
              const isServer = msg.senderName === '[SERVER]' // TODO THIS IS WRONG
              const isSelf = msg.senderName === username
      
              return (
                <div
                  key={index}
                  className={`
                    px-3 py-2 rounded-lg max-w-[80%] w-fit
                    ${isServer
                      ? 'bg-yellow-200 text-black mx-auto text-center font-medium'
                      : isSelf
                      ? 'bg-blue-600 text-white self-end ml-auto'
                      : 'bg-gray-300 text-black self-start mr-auto'
                    }
                  `}
                >
                  {!isServer && (
                    <span className="block text-xs font-semibold opacity-70">
                      {msg.senderName}
                    </span>
                  )}
                  <span className="block break-words">{msg.contents}</span>
                </div>
              )
            })}
          </div>

          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 border-t border-white/20 px-4 py-3 bg-white/5"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 rounded-lg px-4 py-2 bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Type a message..."
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 transition text-white font-semibold shadow"
            >
              Send
            </button>
          </form>
        </div>
      )

}
import React, { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'

export default function ChatBox({ chatId }) {
    const chat = useGameStore(state => state.sharedChats.get(chatId))
    const messages = useGameStore(state => state.sharedChats.get(chatId)?.messages)
    const emit = useGameStore(state => state.emit)
    const username = useGameStore(state => state.username)

    const allChats = useGameStore(state => state.sharedChats)

    const [showDropdown, setShowDropdown] = useState(false)
    const [message, setMessage] = useState('')
    const scrollRef = useRef()

    useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

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
          <div className="flex items-center bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700 text-white text-left py-2 px-4 border-b border-white/20">
            <h5 className="pt-1 text-xl font-bold tracking-wide truncate drop-shadow-sm">{chat?.name /*  TODO make this look less buttony */}</h5>
            <div className='relative'>
                <button
                  onClick={() => setShowDropdown((prev) => !prev)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" 
                        className={`w-5 h-5 text-white ml-2 transform transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                  >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {showDropdown && (
                  <div className='absolute z-10 mt-2 w-56 origin-top-right rounded-md bg-black/90 shadow'>
                    <ul className='py-1 text-sm text-white max-h-60 overflow-y-auto'>
                    {Array.from(allChats).map(([chatId, chat]) => (
                        chat.canRead && (<li key={chatId}>
                        {chat.name}
                        </li>)
                    ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
      
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 no-scrollbar">
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
            <div ref={scrollRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 border-t border-white/20 px-4 py-3 bg-white/5"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 rounded-lg px-4 py-2 bg-white/10 text-white placeholder-white/60 focus:outline-blue-700"
              placeholder="Type a message..."
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700 hover:from-blue-700 hover:to-indigo-800 transition text-white font-semibold shadow"
            >
              Send
            </button>
          </form>
        </div>
      )

}
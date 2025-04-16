import React, { useState, useEffect, useRef, use } from 'react'
import { useGameStore } from '../store/useGameStore'

export default function ChatBox({ chatId, setChatWindowId }) {
    const chat = useGameStore(state => state.sharedChats.get(chatId))
    const messages = useGameStore(state => state.sharedChats.get(chatId)?.messages)
    const canWrite = useGameStore(state => state.sharedChats.get(chatId)?.canWrite)
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
        return (
        <div className='w-full h-full flex items-center justify-center'>
        <div role="status">
          <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
        )
    }

    return (
        <div className="h-full flex flex-col rounded-xl backdrop-blur-lg bg-white/10 shadow-xl overflow-hidden">
          <div className="flex items-center bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700 text-white text-left py-2 px-4 border-b border-white/20">
            <h5 className="pt-1 text-xl font-bold tracking-wide truncate drop-shadow-sm">{chat?.name /*  TODO make this look less buttony */}</h5>
            {allChats.size > 1 && (<div className='relative'>
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
                  <div className='absolute z-10 mt-1 w-40 origin-top-right rounded-md bg-slate-800 shadow'>
                    <div className={`text-sm text-white max-h-90 overflow-y-auto no-scrollbar`}>
                    {Array.from(allChats).reverse().map(([chatId, chat]) => (
                        chat.canRead && (<div className='first:rounded-t-md last:border-none last:rounded-b-md px-2 py-1 hover:bg-slate-500 hover:cursor-pointer truncate w-full border-b border-slate-700' onClick={() => {
                          setShowDropdown(false)
                          setChatWindowId(chatId)}} key={chatId}>
                        {chat.name}
                        </div>)
                    ))}
                    </div>
                  </div>
                )}
            </div>)}
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
              className="flex-1 rounded-lg px-4 py-2 bg-white/10 text-white placeholder-white/60 focus:outline-blue-700 disabled:hover:cursor-not-allowed"
              placeholder={canWrite ? 'Type a message...' : 'You can\'t send messages here right now!'}
              disabled={!canWrite}
              required
            />
            <button
              type="submit"
              disabled={!canWrite}
              className="px-4 py-2 rounded bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700 hover:from-blue-700 hover:to-indigo-800 transition text-white font-semibold shadow disabled:hover:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      )

}
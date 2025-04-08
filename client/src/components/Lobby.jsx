import React from 'react'
import LobbyLogin from './LobbyLogin'
import Game from './Game'
import "bootstrap/dist/css/bootstrap.min.css"
import { useGameStore, PhaseType } from '../store/useGameStore'
import ChatBox from './ChatBox'
import PlayerList from './PlayerList'

export default function Lobby() {
    const username = useGameStore(state => state.username)
    const socket = useGameStore(state => state.socket)
    const admin = useGameStore(state => state.admin)
    const phaseType = useGameStore(state => state.gamePhaseType)
    const lobbyChatId = useGameStore(state => state.lobbyChat)
    
    function handleJoin(submittedUsername) {
        const { emit, setUsername, setLobbyChat, setAdmin } = useGameStore.getState()
        
        socket.once('JOIN_SUCCESS', ({lobbyChat, isAdminOnJoin}) => {
            socket.emit('FETCH_PLAYER_LIST')
            setUsername(submittedUsername)
            setAdmin(isAdminOnJoin)
            setLobbyChat(lobbyChat)
        })

        socket.once('JOIN_ERROR', ({ errorMessage }) => {alert(errorMessage)})

        emit('CLICK_JOIN_GAME', { username: submittedUsername })
    }
    
    return (
        !username ? <LobbyLogin onUsernameSubmit={handleJoin}/> : 
        ( phaseType === PhaseType.DAY || phaseType === PhaseType.NIGHT ? <Game /> :
            <div className="h-screen flex flex-col">
            {/* Main content centered vertically and horizontally */}
            <div className="flex flex-1 items-center justify-center gap-8 px-4">
              <PlayerList lobbyMode={true} />
              <ChatBox chatId={lobbyChatId} />
            </div>
          
            {/* Admin bottom bar */}
            {admin && (
              <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 py-4">
                <div className="flex justify-center gap-4">
                  <button
                    className="px-4 py-2 border border-white text-white rounded hover:bg-white/10 transition"
                    onClick={() => console.log("1")}
                  >
                    1
                  </button>
                  <button
                    className="px-4 py-2 border border-white text-white rounded hover:bg-white/10 transition"
                    onClick={() => console.log("2")}
                  >
                    2
                  </button>
                  <button
                    className="px-4 py-2 border border-white text-white rounded hover:bg-white/10 transition"
                    onClick={() => socket.emit('CLICK_START_GAME')}
                  >
                    Start Game
                  </button>
                </div>
              </div>
            )}
          </div>)
    )
}
import React from 'react'
import LobbyLogin from './LobbyLogin'
import Game from './Game'
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

    if (!username) return <LobbyLogin onUsernameSubmit={handleJoin}/>
    else if (phaseType === PhaseType.DAY || phaseType === PhaseType.NIGHT) return <Game />
    else return (
      <div className="h-screen flex bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white">
        <div className="flex-[3] p-4 overflow-hidden">
          <div className="h-full backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl">
            <ChatBox chatId={lobbyChatId} />
          </div>
        </div>
      <div className="flex-[1] p-4 flex flex-col gap-4">
        <div className="flex-1 backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl">
          <PlayerList lobbyMode={true} />
        </div>
        {admin && (
          <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl overflow-hidden">
            <button
              className="w-full px-4 py-2 text-white rounded bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-600 transition-all duration-300 shadow-lg"
              onClick={() => socket.emit('CLICK_START_GAME')}
            >
              Start Game
            </button>
          </div>
        )}
        </div>
    </div>
    )
}
import React from 'react'
import LobbyLogin from './LobbyLogin'
import { Container } from 'react-bootstrap'
import { useGameStore } from '../store/useGameStore'
import ChatBox from './ChatBox'

export default function Lobby() {
    const username = useGameStore(state => state.username)
    const lobbyChatId = useGameStore(state => state.lobbyChat)
    const playerList = useGameStore(state => state.playerList)
    
    const playerDisplay = playerList.map(({ username, admin }) => (
        admin ? `${username} (ADMIN)` : username
    ))
    
    function handleJoin(submittedUsername) {
        const { emit, socket, setUsername, setLobbyChat } = useGameStore.getState()
        
        socket.once('JOIN_SUCCESS', ({lobbyChat}) => {
            setUsername(submittedUsername)
            setLobbyChat(lobbyChat)
        })

        socket.once('JOIN_ERROR', ({ errorMessage }) => {alert(errorMessage)})

        emit('CLICK_JOIN_GAME', { username: submittedUsername })
    }
    
    return (
        !username ? <LobbyLogin onUsernameSubmit={handleJoin}/> :
        <Container className="align-items-center d-flex" style={{height:'100vh'}}>
            <h3>Users: {playerDisplay.join(', ')}</h3>
            <ChatBox chatId={lobbyChatId}/>
        </Container>
    )
}
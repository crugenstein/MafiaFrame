import React from 'react'
import LobbyLogin from './LobbyLogin'
import "bootstrap/dist/css/bootstrap.min.css"
import { Container, Button, Navbar } from 'react-bootstrap'
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
            socket.emit('FETCH_PLAYER_LIST')
            setUsername(submittedUsername)
            setLobbyChat(lobbyChat)
        })

        socket.once('JOIN_ERROR', ({ errorMessage }) => {alert(errorMessage)})

        emit('CLICK_JOIN_GAME', { username: submittedUsername })
    }
    
    return (
        !username ? <LobbyLogin onUsernameSubmit={handleJoin}/> : <div>
        <Container className="align-items-center d-flex" style={{height:'100vh'}}>
            <h3>Users: {playerDisplay.join(', ')}</h3>
            <ChatBox chatId={lobbyChatId}/>
        </Container>
        <Navbar fixed="bottom" bg="dark" variant="dark">
            <Container className="justify-content-center">
                <Button variant="outline-light" className='mx-2' onClick={() => console.log("1")}>1</Button>
                <Button variant="outline-light" className='mx-2' onClick={() => console.log("2")}>2</Button>
                <Button variant="outline-light" className='mx-2' onClick={() => console.log("3")}>3</Button>
            </Container>
        </Navbar>
        </div>
    )
}
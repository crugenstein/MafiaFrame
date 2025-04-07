import React from 'react'
import LobbyLogin from './LobbyLogin'
import Game from './Game'
import "bootstrap/dist/css/bootstrap.min.css"
import { Container, Button, Navbar } from 'react-bootstrap'
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
        <div>
        <Container className="align-items-center d-flex" style={{height:'100vh'}}>
            <PlayerList lobbyMode={true}/>
            <ChatBox chatId={lobbyChatId}/>
        </Container>
        {admin && <Navbar fixed="bottom" bg="dark" variant="dark">
            <Container className="justify-content-center">
                <Button variant="outline-light" className='mx-2' onClick={() => console.log("1")}>1</Button>
                <Button variant="outline-light" className='mx-2' onClick={() => console.log("2")}>2</Button>
                <Button variant="outline-light" className='mx-2' onClick={() => socket.emit('CLICK_START_GAME')}>Start Game</Button>
            </Container>
        </Navbar>}
        </div>)
    )
}
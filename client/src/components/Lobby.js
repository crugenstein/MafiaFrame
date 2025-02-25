import React, { useState, useEffect } from 'react'
import LobbyLogin from './LobbyLogin'
import { Container } from 'react-bootstrap'
import { useSocket } from '../contexts/SocketContext'
import ChatBox from './ChatBox'

export default function Lobby() {
    const socket = useSocket()

    const [username, setUsername] = useState()
    const [players, setPlayers] = useState([])

    useEffect(() => { // When lobby mounts
        if (!socket) {
            console.log("Player is not connected to socket upon mounting Lobby!")
            return
        }

        const playerJoinedWithUsername = ({ username }) => { // client saw a new player join
            setPlayers(prevPlayers => [...prevPlayers, username])
        }
        const onPlayerLeave = ({ username }) => { // client saw a player leave
            setPlayers(prevPlayers => prevPlayers.filter(player => player !== username));
        };

        socket.on('clientside_player_enter_lobby', playerJoinedWithUsername) // open the eventhandlers
        socket.on('clientside_player_left_lobby', onPlayerLeave)

        return () => { // When lobby unmounts
            socket.off('clientside_player_enter_lobby', playerJoinedWithUsername) // goodbye event handlers.
            socket.off('clientside_player_left_lobby', onPlayerLeave)
        };
    }, [socket])

    const fetchPlayers = async () => {
        try {
            const response = await fetch('http://localhost:5000/lobbyPlayers')
            const playerList = await response.json()
            setPlayers(playerList)
        } catch (err) {
            console.log("Error fetching connected players", err)
        }
    }
    
    function handlePlayerUsernameSubmit(submittedUsername) { //The player submitted their username and "connected" completely.
        setUsername(submittedUsername)
        if (!socket) {
            console.log("Player is not connected on submitting username!")
            return
        }
        socket.emit('player_enter_lobby', { username: submittedUsername })
        fetchPlayers()
    }
    
    return (
        !username ? <LobbyLogin onUsernameSubmit={handlePlayerUsernameSubmit}/>
        :
        <Container className="align-items-center d-flex" style={{height:'100vh'}}>
            <h3>Users: {players.join(', ')}</h3>
            <ChatBox chatId={'lobby'}/>
        </Container>
    )
}
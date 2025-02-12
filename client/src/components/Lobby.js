import React, { useState, useRef, useEffect } from 'react'
import LobbyLogin from './LobbyLogin'
import { Container, Form, Button } from 'react-bootstrap'
import { useSocket } from '../contexts/SocketContext'

export default function Lobby() {
    const socket = useSocket()

    const [username, setUsername] = useState()
    const [players, setPlayers] = useState([])
    const [messages, setMessages] = useState([])
    const messageBoxRef = useRef()

    useEffect(() => { // When lobby mounts
        if (!socket) {
            console.log("Player is not connected to socket upon mounting Lobby!")
            return
        }

        const playerJoinedWithUsername = ({ username }) => { // client saw a new player join
            console.log(username + " joined")
            const joinMessage = username + " joined the lobby."
            setMessages(prevMessages => [...prevMessages, joinMessage])
            setPlayers(prevPlayers => [...prevPlayers, username])
        }
        const onPregameMessageReceive = ({ message, username }) => { // client got a message
            const newMessage = username + ": " + message
            setMessages(prevMessages => [...prevMessages, newMessage])
        }
        const onPlayerLeave = ({ username }) => { // client saw a player leave
            setPlayers(prevPlayers => prevPlayers.filter(player => player !== username));
            console.log(username + " left")
            const leaveMessage = username + " disconnected."
            setMessages(prevMessages => [...prevMessages, leaveMessage])
        };

        socket.on('clientside_player_enter_lobby', playerJoinedWithUsername) // open the eventhandlers
        socket.on('receive_pregame_message', onPregameMessageReceive)
        socket.on('clientside_player_left_lobby', onPlayerLeave)

        return () => { // When lobby unmounts
            socket.off('clientside_player_enter_lobby', playerJoinedWithUsername) // goodbye event handlers.
            socket.off('receive_pregame_message', onPregameMessageReceive)
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
    
    function handleMessageSubmit(e) { // temporary until moved into its own component. When player clicks "send" in lobby chat
        e.preventDefault()
        if (!username) {
            console.log("Player tried to send message with no username!")
            return
        }
        const messageContents = messageBoxRef.current.value.trim()
        const sender = username
        if (!socket) {
            console.log("Player is not connected to socket upon sending message!")
            return
        }
        socket.emit('send_pregame_message', { message: messageContents, username: sender })
    }
    
    return (
        !username ? <LobbyLogin onUsernameSubmit={handlePlayerUsernameSubmit}/>
        :
        <Container className="align-items-center d-flex" style={{height:'100vh'}}>
            <h3>Users: {players.join(', ')}</h3>
            <Form onSubmit={handleMessageSubmit} className="w-100">
                <Form.Group>
                    <Form.Label>Enter Message</Form.Label>
                    <Form.Control type="text" ref={messageBoxRef} required></Form.Control>
                </Form.Group>
                <Button type="submit" className="me-2">Send Message</Button>
            </Form>
            {/* Chat Messages TEMP CHANGE FORMATTING LATER */}
            <div style={{ width: '100%', height: '300px', overflowY: 'auto', border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ marginBottom: '5px' }}>{msg}</div>
                ))}
            </div>
        </Container>
    )
}
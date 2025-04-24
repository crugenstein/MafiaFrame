import React, { useRef } from 'react'
import { Container, Form, Button } from 'react-bootstrap'

export default function LobbyLogin({ onUsernameSubmit }) {
    const usernameBoxRef = useRef()

    function handleSubmit(e) {
        e.preventDefault()
        const username = usernameBoxRef.current.value.trim()
        if (username) onUsernameSubmit(username)
    }

    return (
        <Container className="align-items-center d-flex" style={{height:'100vh'}}>
            <Form onSubmit={handleSubmit} className="w-100">
                <Form.Group>
                    <Form.Label>Enter Username</Form.Label>
                    <Form.Control type="text" ref={usernameBoxRef} required></Form.Control>
                </Form.Group>
                <Button type="submit" className="me-2">Join Lobby</Button>
            </Form>
        </Container> 
    )
}
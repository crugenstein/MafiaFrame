import React, { useRef } from 'react'
import { Container, Form, Button } from 'react-bootstrap'

export default function Login({ onUsernameSubmit }) {
    const usernameRef = useRef()
    
    function handleSubmit(e) {
        e.preventDefault()

        onUsernameSubmit(usernameRef.current.value)
    }

    return (
        <Container className="align-items-center d-flex" style={{height:'100vh'}}>
            <Form onSubmit={handleSubmit} className="w-100">
                <Form.Group>
                    <Form.Label>Enter Username</Form.Label>
                    <Form.Control type="text" ref={usernameRef} required></Form.Control>
                </Form.Group>
                <Button type="submit" className="me-2">Login</Button>
                <Button variant="secondary">Create a new username</Button>
            </Form>
        </Container>
    )
}
import React, { useEffect, useState, useRef } from 'react';
import Lobby from './Lobby';
import { useGameStore } from '../store/useGameStore'
import { Container, Form, Button, Spinner, Alert } from 'react-bootstrap'



export default function App() {
  const initSocket = useGameStore(state => state.initSocket)
  const disconnectSocket = useGameStore(state => state.disconnectSocket)

  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addressBoxRef = useRef()

  useEffect(() => {
    return () => {
      disconnectSocket()
    }
  }, [disconnectSocket])

  const connect = async (address) => {
    try {
      await initSocket(address)
      setConnected(true)
    } catch (err) {
      setError(err.message || "Connection failed.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const enteredAddress = addressBoxRef.current.value.trim()
    if (!enteredAddress) return

    setLoading(true)
    setError('')
    
    connect(enteredAddress)
  }

  if (connected) return <Lobby />
  
  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
      <Form onSubmit={handleSubmit} className="w-100" style={{ maxWidth: '400px' }}>
        <Form.Group>
          <Form.Label>Enter Server Address</Form.Label>
          <Form.Control type="text" ref={addressBoxRef} placeholder="Server address..." required />
        </Form.Group>
        <Button type="submit" disabled={loading} className="mt-3 w-100">
          {loading ? <Spinner animation="border" size="sm" /> : 'Connect'}
        </Button>
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Form>
    </Container>
  )
}
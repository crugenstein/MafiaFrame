import React, { useState } from 'react'
import "bootstrap/dist/css/bootstrap.min.css"
import { Container, ListGroup, Navbar, Button, Modal } from "react-bootstrap"
import { useGameStore } from '../store/useGameStore'
import AbilityWindow from './AbilityWindow'
import ChatBox from './ChatBox'


export default function Game() {
    const [activeComponent, setActiveComponent] = useState('notifs')
    const [showPopup, setShowPopup] = useState(false)
    const [selectedChatId, setSelectedChatId] = useState(null)
    const sharedChats = useGameStore(state => state.sharedChats)

    const renderComponent = () => {
        switch (activeComponent) {
            case 'chat': return <ChatBox chatId={selectedChatId}></ChatBox>
            case 'abilities': return <div><AbilityWindow></AbilityWindow></div>
            case 'notifs': return <div>Notification Screen</div>
            default: return <div>Shouldn't be here</div>
        }
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <main className="flex-grow-1">{renderComponent()}</main>
            <Navbar fixed="bottom" bg="dark" variant="dark">
                <Container className="justify-content-center">
                    <Button onClick={() => setShowPopup(true)}>Chats</Button>
                    <Button onClick={() => setActiveComponent('abilities')}>Abilities</Button>
                    <Button onClick={() => setActiveComponent('notifs')}>Notifications</Button>
                </Container>
            </Navbar>

            <Modal show={showPopup} onHide={() => setShowPopup(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Your Shared Chats
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ListGroup>
                        {Array.from(sharedChats).map(([chatId, chat]) => (
                            <ListGroup.Item
                            key={chatId}
                            action
                            onClick={() => {
                                setSelectedChatId(chatId)
                                setActiveComponent('chat')
                                setShowPopup(false)
                            }}
                            >
                                {chat.name}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Modal.Body>
            </Modal>
        </div>
    )
}
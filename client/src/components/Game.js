import React, { useState } from 'react'
import "bootstrap/dist/css/bootstrap.min.css"
import { Container, ListGroup, Navbar, Button, Modal, Alert, Badge } from "react-bootstrap"
import { useGameStore } from '../store/useGameStore'
import AbilityWindow from './AbilityWindow'
import ChatBox from './ChatBox'
import PhaseTimer from './PhaseTimer'


export default function Game() {
    const [activeComponent, setActiveComponent] = useState('abilities')
    const [showPopup, setShowPopup] = useState(false)
    const [selectedChatId, setSelectedChatId] = useState(null)
    const sharedChats = useGameStore(state => state.sharedChats)
    const notifs = useGameStore(state => state.notifications)
    const role = useGameStore(state => state.role)
    const end = useGameStore(state => state.victory)
    const isDesignatedAttacker = useGameStore(state => state.isDesignatedAttacker)

    const renderComponent = () => {
        switch (activeComponent) {
            case 'chat': return <ChatBox chatId={selectedChatId}></ChatBox>
            case 'abilities': return <div><AbilityWindow></AbilityWindow></div>
            case 'notifs': return <div>{notifs.map((notif, index) => (
                <div key={index}>{notif.notificationText}</div>
            ))}</div>
            default: return <div>Shouldn't be here</div>
        }
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            {end ? <Alert variant={end === 'TOWN VICTORY' ? 'success' : 'danger'}>
            {end === 'TOWN VICTORY' ? 'The town won! Hooray!' : (end === 'MAFIA VICTORY' ? 'The Mafia won!' : 'Erm... draw...')}
            </Alert> : null}
            <main className="flex-grow-1">{renderComponent()}</main>
            <Navbar fixed="bottom" bg="dark" variant="dark">
                <Container className="justify-content-center">
                    <Button className='mx-2' onClick={() => setShowPopup(true)}>Chats</Button>
                    <Button className='mx-2' onClick={() => setActiveComponent('abilities')}>Abilities</Button>
                    <Button className='mx-2' onClick={() => setActiveComponent('notifs')}>Notifications</Button>

                    <div className='ms-auto'>
                        <label className='ms-auto' style={{ color: 'white', opacity: 1, visibility: 'visible' }}>{role === null ? 'Generating role...' : `Your role is ${role}.`}</label>
                        {isDesignatedAttacker && <Badge className='mx-2' bg='danger'>🔪 Designated Attacker</Badge>}
                    </div>
                    
                    
                    <div className='ms-auto' style={{ color: 'white', opacity: 1, visibility: 'visible' }}> <PhaseTimer/> </div>
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
                            chat.canRead && (<ListGroup.Item
                                key={chatId}
                                action
                                onClick={() => {
                                    setSelectedChatId(chatId)
                                    setActiveComponent('chat')
                                    setShowPopup(false)
                                }}
                                >
                                    {chat.name}
                                </ListGroup.Item>)
                        ))}
                    </ListGroup>
                </Modal.Body>
            </Modal>
        </div>
    )
}
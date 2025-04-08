import React from 'react'
import { Modal, Button } from 'react-bootstrap'

export default function WhisperTextModal({show, onHide, whisperContents, setWhisperContents, onConfirm}) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Whisper Contents</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <input 
                            type="text" 
                            value={whisperContents}
                            onChange={(e) => setWhisperContents(e.target.value)}
                            className="form-control me-2" 
                            placeholder="Type a whisper..." 
                            required 
                        />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button
                    variant="primary"
                    onClick={onConfirm}
                    disabled={whisperContents = ''}
                >
                    Confirm
                </Button>
            </Modal.Footer>
        </Modal>
    )
}
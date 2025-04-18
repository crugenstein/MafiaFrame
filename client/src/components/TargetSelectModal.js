import React from 'react'
import { Modal, Button, ListGroup } from 'react-bootstrap'

export default function TargetSelectionModal({show, onHide, targets, selectedTarget, setSelectedTarget, onConfirm}) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Select Target</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ListGroup>
                    {targets.map((target) => (
                        <ListGroup.Item
                            key = {target}
                            action
                            onClick={() => setSelectedTarget(target)}
                            active={selectedTarget === target}
                        >{target}</ListGroup.Item>
                    ))}
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button
                    variant="primary"
                    onClick={onConfirm}
                    disabled={!selectedTarget}
                >
                    Confirm
                </Button>
            </Modal.Footer>
        </Modal>
    )
}
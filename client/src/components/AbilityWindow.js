import { useState } from 'react'
import { useGameStore } from "../store/useGameStore";
import { Card, Button } from 'react-bootstrap';
import TargetSelectionModal from './TargetSelectModal';

export default function AbilityWindow() {
    const abilities = useGameStore(state => state.abilities)
    const emit = useGameStore(state => state.emit)
    const playerList = useGameStore(state => state.playerList)
    const [showModal, setShowModal] = useState(false)
    const [selectedAbility, setSelectedAbility] = useState(null)
    const [selectedTarget, setSelectedTarget] = useState(null) // this is temporary because we are only picking one

    console.log(playerList)

    const handleUseAbility = (ability) => {
        setSelectedAbility(ability)
        setShowModal(true)
    }

    const handleConfirm = () => {
        if (selectedAbility && selectedTarget) {
            emit('CLICK_SUBMIT_ABILITY', {abilityId: selectedAbility.id, targetData: [selectedTarget]}) // this targetData will need to be updated later because we love dynamic things
            setShowModal(false)
        }
    }

    return (
        <div>
            <div className="row">
                {abilities.map((ability) => ( // is the 4x3 grid causing overflow? need to look at it.
                    <div className="col-md-4 mb-3" key={ability.id}>
                        <Card>
                            <Card.Body>
                                <Card.Title>{ability.name}</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">{ability.description}</Card.Subtitle>
                                <Card.Text>Usages: {ability.usages === 'Infinity' ? '∞' : ability.usages}</Card.Text>
                                <Button
                                    variant="primary"
                                    onClick={() => handleUseAbility(ability)}
                                >
                                    Use
                                </Button>
                            </Card.Body>
                        </Card>
                    </div>
                ))}
            </div>
            <TargetSelectionModal 
                show={showModal} 
                onHide={() => setShowModal(false)} 
                targets={playerList} 
                selectedTarget={selectedTarget} 
                setSelectedTarget={setSelectedTarget} 
                onConfirm={handleConfirm}>
            </TargetSelectionModal>
        </div>
    )
}
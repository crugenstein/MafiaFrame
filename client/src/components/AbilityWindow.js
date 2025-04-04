import { useState } from 'react'
import { useGameStore, PhaseType, AbilityTag, PlayerAlignment, PlayerStatus } from "../store/useGameStore";
import { Card, Button, Badge } from 'react-bootstrap';
import TargetSelectionModal from './TargetSelectModal';
import WhisperTextModal from './WhisperTextModal';

export default function AbilityWindow() {
    const abilities = useGameStore(state => state.abilities)
    const emit = useGameStore(state => state.emit)
    const playerData = useGameStore(state => state.allPlayerData)
    const phaseType = useGameStore(state => state.gamePhaseType)
    const whisperCount = useGameStore(state => state.whispers)
    const playerAlignment = useGameStore(state => state.playerAlignment)
    const isDesignatedAttacker = useGameStore(state => state.isDesignatedAttacker)
    const name = useGameStore(state => state.username)

    const [showModal, setShowModal] = useState(false)
    const [availableTargets, setAvailableTargets] = useState([])
    const [selectedAbility, setSelectedAbility] = useState(null)
    const [selectedTarget, setSelectedTarget] = useState(null) // this is temporary because we are only picking one
    const [whisperContents, setWhisperContents] = useState('') // temporary?
    const [showWhisperModal, setShowWhisperModal] = useState(false)

    const handleUseAbility = (ability) => {
        if (ability === 'DA_VOTE') {
            const mafiaPlayers = Array.from(playerData).filter(([_, data]) => data.visibleAlignment === PlayerAlignment.MAFIA && data.status === PlayerStatus.ALIVE).map(([username, _]) => username)
            setAvailableTargets(mafiaPlayers)
        } else if (ability === 'VOTE') {
            setAvailableTargets(Array.from(playerData).filter(([_, data]) => data.status === PlayerStatus.ALIVE).map(([username, _]) => username))
        } else {
            setAvailableTargets(Array.from(playerData).filter(([username, data]) => username !== name && data.status === PlayerStatus.ALIVE).map(([username, _]) => username))
        }
        setSelectedAbility(ability)
        setShowModal(true)
    }

    const handleConfirm = () => {
        if (selectedAbility && selectedTarget) {
            if (selectedAbility === 'WHISPER') {
                setShowModal(false)
                setShowWhisperModal(true)
            } else if (selectedAbility === 'VOTE') {
                emit('CLICK_VOTE_ACTION', {target: selectedTarget})
                setShowModal(false)
            } else if (selectedAbility === 'DA_VOTE') {
                emit('CLICK_DA_VOTE_ACTION', {target: selectedTarget})
                setShowModal(false)
            }
            else {
                emit('CLICK_SUBMIT_ABILITY', {abilityId: selectedAbility.id, targetData: [selectedTarget]}) // this targetData will need to be updated later because we love dynamic things
                setShowModal(false)
            }
        }
    }

    const handleWhisperConfirm = () => {
        emit('CLICK_WHISPER_ACTION', {contents: whisperContents, recipient: selectedTarget})
        setShowWhisperModal(false)
    }

    return (
        <div>
            <div >
                {abilities.map((ability) => ( // is the 4x3 grid causing overflow? need to look at it.
                    <div className="col-md-4 mb-3" key={ability.id}>
                        <Card>
                            <Card.Body>
                                <Badge bg="secondary" className="position-absolute top-0 end-0 m-2" style={{ fontSize: '1.2rem' }}>
                                    {ability.tags.includes(AbilityTag.DAY) ? '☀️' : '🌙'}</Badge>
                                <Card.Title>{ability.name}</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">{ability.description}</Card.Subtitle>
                                <Card.Text>Usages: {ability.usages === 'Infinity' ? '∞' : ability.usages}</Card.Text>
                                <Button
                                    variant="primary"
                                    onClick={() => handleUseAbility(ability)}
                                    disabled={(phaseType === PhaseType.DAY && !ability.tags.includes(AbilityTag.DAY)) ||  
                                            (phaseType === PhaseType.NIGHT && !ability.tags.includes(AbilityTag.NIGHT)) ||
                                            (!isDesignatedAttacker && ability.tags.includes(AbilityTag.DESIGNATED))
                                    }
                                >
                                    Use
                                </Button>
                            </Card.Body>
                        </Card>
                    </div>
                ))}
            </div>
            {phaseType === PhaseType.DAY && <div className="col-md-4 mb-3" >
                <Card>
                    <Card.Body>
                        <Card.Title>Send Whisper</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">Select another player. You will send them a private message.</Card.Subtitle>
                        <Card.Text>Whispers Left: {whisperCount}</Card.Text>
                        <Button
                            variant="primary"
                            onClick={() => handleUseAbility('WHISPER')}
                            disabled={whisperCount < 1}
                            >
                                Whisper
                        </Button>
                    </Card.Body>
                </Card>
            </div>}
            {phaseType === PhaseType.DAY && 
            <div className="col-md-4 mb-3" >
                <Card>
                    <Card.Body>
                        <Card.Title>Cast Vote</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">Cast your vote to Axe another player.</Card.Subtitle>
                        <Button
                            variant="primary"
                            onClick={() => handleUseAbility('VOTE')}
                            >
                                Vote
                        </Button>
                    </Card.Body>
                </Card>
            </div>}
            {(phaseType === PhaseType.DAY && playerAlignment === PlayerAlignment.MAFIA) && 
            <div className="col-md-4 mb-3" >
                <Card>
                    <Card.Body>
                        <Card.Title>Vote for Designated Attacker</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">Cast your vote elect the Mafia's Designated Attacker.</Card.Subtitle>
                        <Button
                            variant="primary"
                            onClick={() => handleUseAbility('DA_VOTE')}
                            >
                                Vote
                        </Button>
                    </Card.Body>
                </Card>
            </div>
            }
            
            <TargetSelectionModal 
                show={showModal} 
                onHide={() => setShowModal(false)} 
                targets={availableTargets}
                selectedTarget={selectedTarget} 
                setSelectedTarget={setSelectedTarget} 
                onConfirm={handleConfirm}>
            </TargetSelectionModal>

            <WhisperTextModal 
                show={showWhisperModal} 
                onHide={() => setShowWhisperModal(false)}
                whisperContents={whisperContents}
                setWhisperContents={setWhisperContents}
                onConfirm={handleWhisperConfirm}>
            </WhisperTextModal>
        </div>
    )
}
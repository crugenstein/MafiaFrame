import { useState } from 'react'
import TargetSelectionModal from './TargetSelectModal'
import Toast from './Toast'
import { useGameStore, AbilityTag, PlayerStatus, PhaseType } from "../store/useGameStore"

export default function NewAbilityWindow({ swap }) {
    const abilities = useGameStore(state => state.abilities)
    const abilitySlots = useGameStore(state => state.abilitySlots)
    const playerData = useGameStore(state => state.allPlayerData)
    const phaseType = useGameStore(state => state.gamePhaseType)
    const isDesignatedAttacker = useGameStore(state => state.isDesignatedAttacker)
    const isAlive = useGameStore(state => state.alive)
    const name = useGameStore(state => state.username)
    const emit = useGameStore(state => state.emit)

    const [showModal, setShowModal] = useState(false)
    const [showToast, setShowToast] = useState(false)
    const [toastText, setToastText] = useState('')
    const [selectedAbility, setSelectedAbility] = useState(null)
    const [selectedTarget, setSelectedTarget] = useState(null)
    const [availableTargets, setAvailableTargets] = useState([])

    const handleUseAbility = (ability) => {
        setAvailableTargets(Array.from(playerData).filter(([username, data]) => username !== name && data.status === PlayerStatus.ALIVE).map(([username, _]) => username))
        setSelectedAbility(ability)
        setShowModal(true)
    }

    const handleConfirm = () => {
        if (selectedAbility && selectedTarget) {
            const display = abilitySlots - 1
            emit('CLICK_SUBMIT_ABILITY', {abilityId: selectedAbility.id, targetData: [selectedTarget]}) // this targetData will need to be updated later because we love dynamic things
            setSelectedTarget(null)
            setShowModal(false)

            setToastText(`Ability recorded! You can use ${display} more abilit${display === 1 ? 'y' : 'ies'} during this phase.`)
            setShowToast(true)
        }
    }

    return (
        <div className="w-full">
            <div className='flex items-center justify-between pb-2'>
                <span className='text-lg font-semibold text-white'>Abilities</span>
            </div>
            <ul className='space-y-3 max-w-full max-h-60 overflow-y-auto'>
                {abilities.map((ability) => (
                    <li key={ability.id} className='w-full rounded-lg bg-white/15 text-white shadow flex flex-col text-sm'>
                        <div className={`text-white text-lg font-semibold flex items-center justify-between border-b border-white/20 py-2 px-3 rounded-top ${ability.tags.includes(AbilityTag.NIGHT) ? 
                        'bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700' : 'bg-gradient-to-r from-orange-600 via-yellow-700 to-orange-600'}`}>
                            <span className='truncate max-w-[270px]'>{ability.name}</span>
                            <div className="bg-black/30 px-2 py-1 rounded">
                                <span>{ability.tags.includes(AbilityTag.DAY) ? '☀️' : '🌙'}</span>
                                <span className="ml-2">{ability.usages === 'Infinity' ? '∞' : `x${ability.usages}`}</span>
                            </div>
                        </div>
                        <div className="wrap-anywhere text-pretty px-3 py-2">{ability.description}</div>
                        <div className="flex justify-end pb-3 pr-4">
                            <button className="hover:bg-red-500 transition ml-auto rounded bg-red-400 px-4 py-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    onClick={() => handleUseAbility(ability)}
                                    disabled={abilitySlots === 0 ||
                                            (ability.tags.includes(AbilityTag.NIGHT) && phaseType !== PhaseType.NIGHT) ||
                                            (ability.tags.includes(AbilityTag.DAY) && phaseType !== PhaseType.DAY) ||
                                            (ability.tags.includes(AbilityTag.DESIGNATED) && !isDesignatedAttacker) ||
                                            !isAlive ||
                                            ability.usages === 0
                                    }
                            >Use</button>
                        </div>
                    </li>
                ))}
            </ul>
            <TargetSelectionModal 
                show={showModal} 
                onHide={() => {
                    setShowModal(false)
                    setSelectedTarget(null)
                }} 
                targets={availableTargets}
                selectedTarget={selectedTarget} 
                setSelectedTarget={setSelectedTarget}
                desc={selectedAbility?.description} 
                onConfirm={handleConfirm}
            />
            <Toast
                show={showToast}
                onHide={() => setShowToast(false)}
                text={toastText}
            />
        </div>
    )
}
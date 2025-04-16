import { useState } from 'react'
import { PhaseType, PlayerStatus, PlayerAlignment, useGameStore } from '../store/useGameStore'
import WhisperTextModal from './WhisperTextModal'
import Toast from './Toast'

export default function PlayerList({ lobbyMode }) {
    const playerData = useGameStore(state => state.allPlayerData)
    const emit = useGameStore(state => state.emit)
    const whisperCount = useGameStore(state => state.whispers)
    const phaseType = useGameStore(state => state.gamePhaseType)
    const username = useGameStore(state => state.username)

    const [showToast, setShowToast] = useState(false)
    const [toastText, setToastText] = useState('')
    const [whisperTarget, setWhisperTarget] = useState(null)
    const [showWhisperModal, setShowWhisperModal] = useState(false)
    const [whisperContents, setWhisperContents] = useState('')

    const handleWhisperConfirm = () => {
        const display = whisperCount - 1
        emit('CLICK_WHISPER_ACTION', {contents: whisperContents, recipient: whisperTarget})
        setWhisperContents('')
        setShowWhisperModal(false)

        setToastText(`You sent a whisper to ${whisperTarget}. You can send ${display} more whisper${display === 1 ? '' : 's'} during this Day Phase.`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 6000)
    }

    if (lobbyMode) return (
        <div className='w-full'>
            <div className='text-lg font-semibold mb-2 text-white'>Players</div>
            <ul className='space-y-2 max-w-full'>
                {Array.from(playerData).map(([name, data]) => (
                    <li key={name} className='w-full rounded-lg bg-white/15 px-3 py-2 text-white shadow flex items-center justify-between text-sm'>
                        <span className='truncate max-w-[260px]'>{name}</span>
                        <div className='flex items-center gap-2 ml-2 whitespace-nowrap'>
                            {data.admin && (
                                <span className='text-yellow-300 bg-yellow-300/25 rounded px-2 py-0.5 text-xs'>
                                    👑 Admin
                                </span>)
                            }
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
    
    return (
        <div className='flex flex-col h-full'>
            <div className='text-lg font-semibold mb-2 text-white'>Players</div>
            <div className='flex-1 space-y-2 overflow-y-auto no-scrollbar mb-2'>
                {Array.from(playerData).map(([name, data]) => (
                <div key={name} className='w-full rounded-lg bg-white/15 pl-2 pr-3 py-2 text-white shadow flex items-center justify-between text-sm'>
                    <div className="flex items-center gap-x-2 overflow-hidden">
                        <div className="flex items-center gap-x-1">
                            <button className="p-1 rounded bg-indigo-400 hover:bg-indigo-500 transition text-white font-semibold shadow disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        emit('CLICK_VOTE_ACTION', {target: name})
                                    }}
                                    disabled={phaseType !== PhaseType.DAY
                                    }
                            >🪓</button>
                            <button className="p-1 rounded bg-indigo-400 hover:bg-indigo-500 transition text-white font-semibold shadow disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        setWhisperTarget(name)
                                        setShowWhisperModal(true)
                                    }}
                                    disabled={phaseType !== PhaseType.DAY ||
                                        whisperCount < 1 ||
                                        name === username
                                    }
                            >💬</button>
                        </div>
                        <span className="truncate max-w-[260px] text-white">{name}</span>
                    </div>
                    <div className='flex items-center gap-2 ml-2 whitespace-nowrap'>
                        <span className={data.visibleAlignment === PlayerAlignment.MAFIA ? 'font-bold text-red-500' : 'font-bold'}>
                            {`${data.visibleRole !== 'UNKNOWN' ? ` ${data.visibleRole} ` : ''}`}
                        </span>
                        {data.status === PlayerStatus.DEAD && (
                            <span className='text-white-300 bg-gray-300/25 rounded px-2 py-0.5 text-xs'>
                                💀 Dead
                            </span>)
                        }
                    </div>
                </div>
            ))}
        </div>
            <WhisperTextModal 
                show={showWhisperModal} 
                onHide={() => {
                    setShowWhisperModal(false)
                    setWhisperContents('')
                }}
                whisperContents={whisperContents}
                setWhisperContents={setWhisperContents}
                onConfirm={handleWhisperConfirm}
                name={whisperTarget}
                >
            </WhisperTextModal>

            <Toast
                show={showToast}
                onHide={() => setShowToast(false)}
                text={toastText}
            />
        </div>
    )
}
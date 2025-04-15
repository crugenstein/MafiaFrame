import { useGameStore, PhaseType } from '../store/useGameStore'
import { useState } from 'react'

export default function NotificationPanel({ swap }) {
    const notifs = useGameStore(state => state.notifications)
    const gamePhaseType = useGameStore(state => state.gamePhaseType)
    const gamePhaseNumber = useGameStore(state => state.gamePhaseNumber)

    const notifPhases = [...new Set(notifs.map(({ notificationTime }) => notificationTime))].reverse()
    const notifsByPhase = Object.groupBy(notifs, ({ notificationTime }) => notificationTime)

    const phaseLabel = (notificationTime) => {
        const slice = notificationTime.split('-')
        return (slice[0] === '1' ? 'Day ' : 'Night ') + slice[1]
    }

    const [openPhase, setOpenPhase] = useState(`${gamePhaseType}-${gamePhaseNumber}`)
    const hasNotifsNow = notifsByPhase[`${gamePhaseType}-${gamePhaseNumber}`]?.length > 0

    const toggleAccordion = (phase) => {
        setOpenPhase(openPhase === phase ? null : phase)
    }

    return (
        <div className='flex flex-col h-full'>
            <div className='flex items-center justify-between mb-2'>
                <span className='text-lg font-semibold text-white'>Notifications</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar mb-2">
                {!hasNotifsNow && // TODO MAKE SCROLL PRETTY
                    <div className="rounded-lg">
                    <button
                        onClick={() => toggleAccordion(`${gamePhaseType}-${gamePhaseNumber}`)}
                        className={`w-full text-white text-lg font-semibold flex items-center justify-between border-b border-white/20 py-2 px-3 rounded-top ${gamePhaseType === PhaseType.NIGHT ? 
                            'bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700' : 'bg-gradient-to-r from-orange-600 via-yellow-700 to-orange-600'}`}
                        >
                        <span>{phaseLabel(`${gamePhaseType}-${gamePhaseNumber}`)}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" 
                            className={`w-5 h-5 text-white ml-2 transform transition-transform duration-200 ${openPhase === `${gamePhaseType}-${gamePhaseNumber}` ? 'rotate-180' : ''}`}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    {openPhase === `${gamePhaseType}-${gamePhaseNumber}` && (
                    <div className="p-2 bg-gray-800 rounded-b-lg"> 
                        <div className="bg-gray-700 text-white rounded px-2 py-1"> Nothing here...</div>
                    </div>
                )}
                </div>
                }
                {notifPhases.map((phase) => (
                    <div key={phase} className="rounded-lg">
                        <button
                            onClick={() => toggleAccordion(phase)}
                            className={`w-full text-white text-lg font-semibold flex items-center justify-between border-b border-white/20 py-2 px-3 rounded-top ${phase[0] === '2' ? 
                                                'bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700' : 'bg-gradient-to-r from-orange-600 via-yellow-700 to-orange-600'}`}
                        >
                            <span>{phaseLabel(phase)}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" 
                                className={`w-5 h-5 text-white ml-2 transform transition-transform duration-200 ${openPhase === phase ? 'rotate-180' : ''}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        {openPhase === phase && (
                            <div className="p-2 bg-gray-800 rounded-b-lg space-y-2">
                                {notifsByPhase[phase].map((notif, index) => (
                                    <div key={index} className="bg-gray-700 text-white rounded px-2 py-1">
                                        {notif.notificationText}
                                    </div>
                                ))}
                    </div>
                 )}
                </div>
            ))}
        </div>
        </div>
    )
}
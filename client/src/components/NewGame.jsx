import AbilityWindow from "./AbilityWindow";
import NewAbilityWindow from "./NewAbilityWindow";
import ChatBox from "./ChatBox";
import PlayerList from "./PlayerList";
import { useGameStore } from "../store/useGameStore"
import { useEffect, useState } from 'react'
import NotificationPanel from "./NotificationPanel";
import PlayerDetails from "./PlayerDetails";
import NewPhaseTimer from "./NewPhaseTimer";

export default function NewGame() {
    const currentDPId = useGameStore(state => state.currentDPId)
    const alive = useGameStore(state => state.alive)

    const [activeComponent, setActiveComponent] = useState('players')
    const [activeChatId, setActiveChatId] = useState(currentDPId)

    const swapComponent = (moveTo) => {
        setActiveComponent(moveTo)
    }

    useEffect(() => {
        if (!activeChatId) setActiveChatId(currentDPId)
    }, [currentDPId])

    const renderComponent = () => {
        switch (activeComponent) {
            case 'abilities': return <NewAbilityWindow swap={swapComponent} />
            case 'notifs': return <NotificationPanel swap={swapComponent} />
            case 'players' : return <PlayerList lobbyMode={false} />
            default: return <div>Shouldn't be here</div>
        }
    }

    return (
        <div className="font-game h-screen relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white">
        <div className="absolute inset-0 z-0 animate-grid bg-grid" />
        {!alive && <div className="absolute inset-0 z-0 pointer-events-none vignette" />}
        <div className="relative z-10 flex h-full">
                <div className="flex-[5] p-4 overflow-hidden">
                    <div className="h-full backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl">
                        <ChatBox chatId={activeChatId} setChatWindowId={setActiveChatId} />
                    </div>
                </div>
                <div className="flex-[2] p-4 flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 flex flex-col backdrop-blur-lg bg-white/10 rounded-xl shadow-xl overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4">{renderComponent()}</div>
                        <div className="py-3 flex items-center space-evenly justify-center bg-white/5 gap-3">
                            <button title="Player List" className={`flex items-center px-3 py-3 rounded ${activeComponent === 'players' ? 'bg-indigo-800 mt-1' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                            onClick={() => setActiveComponent('players')}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                                    <circle cx="8" cy="7" r="4" />
                                    <path d="M2 21v-1a6 6 0 0 1 12 0v1" />
                                    <line x1="16" y1="4" x2="22" y2="4" />
                                    <line x1="16" y1="8" x2="22" y2="8" />
                                    <line x1="16" y1="12" x2="22" y2="12" />
                                </svg>
                            </button>

                            <button title="Abilities" className={`flex items-center px-3 py-3 rounded ${activeComponent === 'abilities' ? 'bg-indigo-800 mt-1' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                            onClick={() => setActiveComponent('abilities')}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 2L6 14h5l-1 8 7-12h-5l1-8z" />
                                </svg>
                            </button>

                            <button title="Notifications" className={`flex items-center px-3 py-3 rounded ${activeComponent === 'notifs' ? 'bg-indigo-800 mt-1' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                            onClick={() => setActiveComponent('notifs')}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.993 2.993 0 0118 12V9a6 6 0 10-12 0v3a2.993 2.993 0 01-1.595 3.595L4 17h5m6 0a3 3 0 11-6 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl overflow-x-auto">
                        <div className="flex items-center justify-between">
                            <PlayerDetails />
                            {!alive && (
                                <div className='bg-red-400 py-1 px-2 text-xl rounded font-bold text-red-800'>
                                    💀 DEAD 💀
                                </div>
                            )}
                            <NewPhaseTimer />
                        </div>
                    </div>
                </div>
        </div>
        </div>
    )
}
import AbilityWindow from "./AbilityWindow";
import NewAbilityWindow from "./NewAbilityWindow";
import ChatBox from "./ChatBox";
import PlayerList from "./PlayerList";
import { useGameStore } from "../store/useGameStore"
import { useState } from 'react'
import NotificationPanel from "./NotificationPanel";
import PlayerDetails from "./PlayerDetails";

export default function NewGame() {
    const currentDPId = useGameStore(state => state.currentDPId)

    const [activeComponent, setActiveComponent] = useState('abilities')

    const swapComponent = (moveTo) => {
        setActiveComponent(moveTo)
    }

    const renderComponent = () => {
        switch (activeComponent) {
            case 'abilities': return <NewAbilityWindow swap={swapComponent} />
            case 'notifs': return <NotificationPanel swap={swapComponent} />
            case 'players' : return <PlayerList lobbyMode={false} />
            default: return <div>Shouldn't be here</div>
        }
    }

    return (
        <div className="h-screen flex bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white">
            <div className="flex-[5] p-4 overflow-hidden">
                <div className="h-full backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl">
                    <ChatBox chatId={currentDPId} />
                </div>
            </div>
            <div className="flex-[2] p-4 flex flex-col gap-4 overflow-hidden">
                <div className="flex-1 flex flex-col backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl overflow-hidden">
                    <div className="flex-1 overflow-y-auto">{renderComponent()}</div>
                    <div className="flex items-center justify-between pt-2">
                        <button className="flex items-center bg-indigo-500 px-2 py-1 rounded hover:bg-indigo-600"
                        onClick={() => setActiveComponent('players')}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                                <circle cx="8" cy="7" r="4" />
                                <path d="M2 21v-1a6 6 0 0 1 12 0v1" />
                                <line x1="16" y1="4" x2="22" y2="4" />
                                <line x1="16" y1="8" x2="22" y2="8" />
                                <line x1="16" y1="12" x2="22" y2="12" />
                            </svg>
                            <span className='ml-1 text-md font-semibold text-white'>Players</span>
                        </button>

                        <button className="flex items-center bg-indigo-500 px-2 py-1 rounded hover:bg-indigo-600"
                        onClick={() => setActiveComponent('abilities')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 2L6 14h5l-1 8 7-12h-5l1-8z" />
                            </svg>
                            <span className='text-md font-semibold text-white'>Abilities</span>
                        </button>

                        <button className="flex items-center bg-indigo-500 px-2 py-1 rounded hover:bg-indigo-600"
                        onClick={() => setActiveComponent('notifs')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.993 2.993 0 0118 12V9a6 6 0 10-12 0v3a2.993 2.993 0 01-1.595 3.595L4 17h5m6 0a3 3 0 11-6 0" />
                            </svg>
                            <span className='ml-0.5 text-md font-semibold text-white'>Notifications</span>
                        </button>
                    </div>
                </div>
                <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl">
                    <PlayerDetails />
                </div>
            </div>
        </div>
    )
}
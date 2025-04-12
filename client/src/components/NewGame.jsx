import AbilityWindow from "./AbilityWindow";
import NewAbilityWindow from "./NewAbilityWindow";
import ChatBox from "./ChatBox";
import PlayerList from "./PlayerList";
import { useGameStore } from "../store/useGameStore"
import { useState } from 'react'
import NotificationPanel from "./NotificationPanel";

export default function NewGame() {
    const currentDPId = useGameStore(state => state.currentDPId)

    const [activeComponent, setActiveComponent] = useState('abilities')

    const swapComponent = () => {
        activeComponent === 'abilities' ? setActiveComponent('notifs') : setActiveComponent('abilities')
    }

    const renderComponent = () => {
        switch (activeComponent) {
            case 'abilities': return <NewAbilityWindow swap={swapComponent} />
            case 'notifs': return <NotificationPanel swap={swapComponent} />
            default: return <div>Shouldn't be here</div>
        }
    }

    return (
        <div className="h-screen flex bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white">
            <div className="flex-[3] p-4 overflow-hidden">
                <div className="h-full backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl">
                    <ChatBox chatId={currentDPId} />
                </div>
            </div>
            <div className="flex-[1] p-4 flex flex-col gap-4">
                <div className="flex-1 backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl">
                    <PlayerList lobbyMode={false} />
                </div>
                <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 shadow-xl overflow-hidden">
                    {renderComponent()}
                </div>
            </div>
        </div>
    )
}
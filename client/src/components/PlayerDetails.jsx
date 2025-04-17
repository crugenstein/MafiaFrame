import { useGameStore } from "../store/useGameStore"

export default function PlayerDetails() {
    const role = useGameStore(state => state.role)

    const renderRole = (role) => {
        switch (role) {
            case 'Detective': return (
                <div className="items-center rounded px-3 inline-flex p-1 bg-green-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span className="pl-2 text-green-900 font-semibold text-xl">Detective</span>
                </div>
            )
            case 'Guard': return (
                <div className="items-center rounded px-3 inline-flex p-1 bg-green-500">
                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="green">
                        <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zM12 4.15L18 6.5v4.5c0 4.14-2.88 8.58-6 9.85-3.12-1.27-6-5.71-6-9.85V6.5l6-2.35z"/>
                    </svg>
                    <span className="pl-2 text-green-900 font-semibold text-xl">Guard</span>
                </div>
            )
            case 'Godfather': return (
                <div className="items-center rounded px-3 inline-flex p-1 bg-red-900">
                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span className="pl-2 text-red-400 font-semibold text-xl">Godfather</span>
                </div>
            )
            case 'Mafioso': return (
                <div className="items-center rounded px-3 inline-flex p-1 bg-red-900">
                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="red">
                        <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zM12 4.15L18 6.5v4.5c0 4.14-2.88 8.58-6 9.85-3.12-1.27-6-5.71-6-9.85V6.5l6-2.35z"/>
                    </svg>
                    <span className="pl-2 text-red-400 font-semibold text-xl">Mafioso</span>
                </div>
            )
            default: return (
                <span>Loading...</span>
            )
        }
    }

    return (
        <div>
            <span className="pl-1">{renderRole(role)}</span>
        </div>
    )
}
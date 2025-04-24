import { useGameStore, PhaseType } from '../store/useGameStore'

export default function NewPhaseTimer() {
    const phaseType = useGameStore(state => state.gamePhaseType)
    const phaseNumber = useGameStore(state => state.gamePhaseNumber)
    const phaseTimeLeft = useGameStore(state => state.gamePhaseTimeLeft)

    let sec = ('00' + phaseTimeLeft % 60).slice(-2)
    let min = ('00' + parseInt(phaseTimeLeft / 60) % 60).slice(-2)
    let hrs = ('00' + parseInt(phaseTimeLeft / (60*60)) % 24).slice(-2)
    let day = parseInt(phaseTimeLeft / (60*60*24))


    const timerText = 
        (day > 0 ? day + ' days, ' : '') + (hrs <= 0 ? min + ':' + sec + ' min' : hrs + ':' + min + ' hrs')
    const phaseText = 
        phaseType === PhaseType.DAY ? '☀️' + phaseNumber :
        phaseType === PhaseType.NIGHT ? '🌙' + phaseNumber : 
        phaseType === PhaseType.LOBBY ? '⏳' : 
        '⁉️'

    return (
        <div className='flex inline-flex-nowrap whitespace-nowrap'>
            <span className={`px-2 py-1 rounded-l text-xl ${phaseType === PhaseType.NIGHT ? 'bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700' : 
                'bg-gradient-to-r from-orange-600 via-yellow-700 to-orange-600'}`}>{phaseText} </span>
            <span className='bg-white/15 py-1 px-2 text-xl rounded-r'>🕒{phaseTimeLeft}</span>
        </div>
    )
}
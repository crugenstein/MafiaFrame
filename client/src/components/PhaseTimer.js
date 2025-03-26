import { useGameStore } from '../store/useGameStore'

export default function PhaseTimer() {
    const phaseType = useGameStore(state => state.gamePhaseType)
    const phaseNumber = useGameStore(state => state.gamePhaseNumber)
    const phaseTimeLeft = useGameStore(state => state.gamePhaseTimeLeft)

    let sec = phaseTimeLeft % 60
    let min = parseInt(phaseTimeLeft / 60) % 60
    let hrs = parseInt(phaseTimeLeft / (60*60)) % 60

    const timerText = hrs <= 0 ? min + ':' + sec + ' min' : hrs + ':' + min + ' hrs'
    const phaseText = 
        phaseType == phaseType.DAY ? '☼' + phaseNumber :
        phaseType == phaseType.NIGHT ? '☾' + phaseNumber : 
        '⧖'

    return (
        <label>
            { phaseText } { timerText }
        </label>
    )
}
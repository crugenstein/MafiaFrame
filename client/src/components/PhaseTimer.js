import { useGameStore, PhaseType } from '../store/useGameStore'

export default function PhaseTimer() {
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
        phaseType === PhaseType.DAY ? '☼' + phaseNumber :
        phaseType === PhaseType.NIGHT ? '☾' + phaseNumber : 
        phaseType === PhaseType.LOBBY ? '⧖' : 
        '?'

    return (
        <label>
            { phaseText } - { timerText }
        </label>
    )
}
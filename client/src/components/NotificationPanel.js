import { useGameStore } from '../store/useGameStore'
import { Accordion } from 'react-bootstrap'

export default function NotificationPanel() {
    const notifs = useGameStore(state => state.notifications)
    const gamePhaseType = useGameStore(state => state.gamePhaseType)
    const gamePhaseNumber = useGameStore(state => state.gamePhaseNumber)

    const notifPhases = [...new Set(notifs.map(({ notificationTime }) => notificationTime))].reverse()
    const notifsByPhase = Object.groupBy(notifs, ({ notificationTime }) => notificationTime)

    const phaseLabel = (notificationTime) => {
        const slice = notificationTime.slice('-')
        return (slice[0] === '1' ? 'Day ' : 'Night ') + slice[2]
    }

    return (
        <Accordion defaultActiveKey={`${gamePhaseType}-${gamePhaseNumber}`} alwaysOpen>
            {notifPhases.map((phase) => 
                <Accordion.Item eventKey={phase}>
                    <Accordion.Header>
                        {phaseLabel(phase)}
                    </Accordion.Header>
                    <Accordion.Body>
                        {notifsByPhase[phase].map((notif, index) => 
                            <div key={index}>
                                {notif.notificationText}
                            </div>
                        )}
                    </Accordion.Body>
                </Accordion.Item>
            )}    
        </Accordion>
    )

}
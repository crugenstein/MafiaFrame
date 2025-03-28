import { useGameStore } from '../store/useGameStore'

export default function NotificationPanel() {
    const notifs = useGameStore(state => state.notifications)

    return (
        <div>
            {notifs.map((notif, index) => 
                <div key={index}>
                    {notif.notificationText}
                </div>
            )}
        </div>
    )

}
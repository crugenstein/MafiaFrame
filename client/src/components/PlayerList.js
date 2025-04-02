import { useGameStore } from '../store/useGameStore'
import { ListGroup } from 'react-bootstrap'

export default function PlayerList() {
    const playerData = useGameStore(state => state.allPlayerData)

    return (
        <ListGroup>
            <ListGroup.Item variant='primary'>Players</ListGroup.Item>
            {Array.from(playerData).map(([name, data]) => (
                <ListGroup.Item key={name}>{name} {data.admin ? '👑' : null}</ListGroup.Item>
            ))}
        </ListGroup>      
    )
}
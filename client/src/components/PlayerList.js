import { useGameStore } from '../store/useGameStore'
import { Badge, ListGroup } from 'react-bootstrap'

export default function PlayerList() {
    const playerData = useGameStore(state => state.allPlayerData)

    return (
        <ListGroup>
            <ListGroup.Item variant='primary'>Players</ListGroup.Item>
            {Array.from(playerData).map(([name, data]) => (
                <ListGroup.Item className='text-truncate' style={{maxWidth: '10vw'}} key={name}>{name} {data.admin && <Badge bg='warning'>👑 Admin</Badge>}</ListGroup.Item>
            ))}
        </ListGroup>      
    )
}
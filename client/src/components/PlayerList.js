import { PlayerStatus, PlayerAlignment, useGameStore } from '../store/useGameStore'
import { Badge, ListGroup } from 'react-bootstrap'

export default function PlayerList({ lobbyMode }) {
    const playerData = useGameStore(state => state.allPlayerData)

    return (
        lobbyMode ? 
        <ListGroup>
            <ListGroup.Item variant='primary'>Players</ListGroup.Item>
            {Array.from(playerData).map(([name, data]) => (
                <ListGroup.Item className='text-truncate' style={{maxWidth: '20vw'}} key={name}>{name} {data.admin && <Badge bg='warning'>👑 Admin</Badge>}</ListGroup.Item>
            ))}
        </ListGroup> 
        :
        <ListGroup>
            <ListGroup.Item variant='primary'>Players</ListGroup.Item>
            {Array.from(playerData).map(([name, data]) => (
                <ListGroup.Item className='text-truncate' style={{maxWidth: '20vw'}} variant={data.status === PlayerStatus.DEAD ? 'secondary' : ''} key={name}>
                    <span className={data.visibleAlignment === PlayerAlignment.MAFIA ? 'text-danger fw-bold' : ''}>
                        {`${name}${data.visibleRole !== 'UNKNOWN' ? ` (${data.visibleRole}) ` : ''}`}
                    </span>
                    {data.status === PlayerStatus.DEAD && <Badge bg='secondary' className='px-2'>💀 Dead</Badge>}
                </ListGroup.Item>
            ))}
        </ListGroup>
    )
}
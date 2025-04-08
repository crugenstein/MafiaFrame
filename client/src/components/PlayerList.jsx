import { PlayerStatus, PlayerAlignment, useGameStore } from '../store/useGameStore'
import { Badge, ListGroup } from 'react-bootstrap'

export default function PlayerList({ lobbyMode }) {
    const playerData = useGameStore(state => state.allPlayerData)

    if (lobbyMode) return (
        <div className='w-full'>
            <div className='text-lg font-semibold mb-2 text-white'>Players</div>
            <ul className='space-y-2 max-w-full'>
                {Array.from(playerData).map(([name, data]) => (
                    <li key={name} className='w-full rounded-lg bg-white/15 px-3 py-2 text-white shadow flex items-center justify-between text-sm'>
                        <span className='truncate'>{name}</span>
                        <div className='flex items-center gap-2 ml-2 whitespace-nowrap'>
                            {data.admin && (
                                <span className='text-yellow-300 bg-yellow-300/25 rounded px-2 py-0.5 text-xs'>
                                    👑 Admin
                                </span>)
                            }
                        </div>
                    </li>
                ))}
            </ul>
        </div> // todo non-lobby mode one
    )

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
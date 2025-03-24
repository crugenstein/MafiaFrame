const { PlayerAlignment } = require('../data/enums')
const { IOManager } = require('./IOManager')
const { GameManager } = require('../utils/GameManager')

const registerRequests = (socket) => {

    socket.on('FETCH_PLAYER_LIST', () => {
        const player = GameManager.getPlayerFromSocketId(socket.id)

        const playerList = GameManager.allPlayers.map((username) => {
            const target = GameManager.getPlayer(username)
            const visibleAlignment = (player.alignment === PlayerAlignment.MAFIA && target.alignment === PlayerAlignment.MAFIA) ? 'MAFIA' : 'UNKNOWN'
    
            return ({
                username, 
                visibleAlignment, 
                admin: target.admin, 
                status: target.status
            })
        })

        IOManager.emitToPlayer(player.username, 'RECEIVE_PLAYER_LIST', {
            playerList
        })
    })
}

module.exports = { registerRequests }
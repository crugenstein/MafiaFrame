const { PlayerAlignment } = require('../data/enums')
const { IOManager } = require('./IOManager')

const registerRequests = (socket, instance) => {

    socket.on('FETCH_PLAYER_LIST', () => {
        const player = instance.getPlayerFromSocketId(socket.id)

        const playerList = instance.allPlayers.map((username) => {
            const target = instance.getPlayer(username)
            const visibleAlignment = (player.alignment === PlayerAlignment.MAFIA && target.alignment === PlayerAlignment.MAFIA) ? 'MAFIA' : 'UNKNOWN'
    
            return ({
                username, 
                visibleAlignment, 
                admin: target.admin, 
                status: target.status
            })
        })

        IOManager.emitToPlayer(player, 'RECEIVE_PLAYER_LIST', {
            playerList
        })
    })
}

module.exports = { registerRequests }
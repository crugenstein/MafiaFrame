const { IOManager } = require('./IOManager')
const { GameManager } = require('../utils/GameManager')
const { PlayerAlignment } = require('../objects/Player')

const registerRequests = (socket) => {

    socket.on('FETCH_PLAYER_LIST', () => {
        const player = GameManager.getPlayerFromSocketId(socket.id)
        let playerList = [] 

        GameManager.allPlayers.forEach((username) => {
            let visibleStatus = 'UNKNOWN'
            if (player.alignment === PlayerAlignment.MAFIA && GameManager.getPlayer(username).alignment === PlayerAlignment.MAFIA) {visibleStatus = 'MAFIA'}
            playerList.push({username, visibleStatus})
        })

        IOManager.emitToPlayer(player.username, 'RECEIVE_PLAYER_LIST', {
            playerList
        })
    })
}

module.exports = { registerRequests }
const { Player } = require('../objects/Player')

class GameManager {
    static players = {}
    static sharedChats = {}

    static gameStatus = 'LOBBY_WAITING' // 'LOBBY_WAITING', 'IN_PROGRESS', or 'GAME_FINISHED'
    static phaseType = 'LOBBY' // 'LOBBY', 'DAY', or 'NIGHT'
    static phaseNumber = 0
    static phaseTimeLeft = 15 // in seconds 

    static addPlayer(socketId) {
        newPlayer = new Player(socketId)
        this.players[socketId] = newPlayer
    }

    static getPlayer(socketId) {
        return this.players[socketId]
    }

    static removePlayer(socketId) {
        delete this.players[socketId]
    }
}

module.exports = { GameManager }
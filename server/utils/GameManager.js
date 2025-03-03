const { Player } = require('../objects/Player')

class GameManager {
    constructor() {
        this.players = {} // DICTIONARY of socketId to Player object
        this.sharedChats = {}
        
        this.gameStatus = 'LOBBY_WAITING' // 'LOBBY_WAITING', 'IN_PROGRESS', or 'GAME_FINISHED'
        this.phaseType = 'LOBBY' // 'LOBBY', 'DAY', or 'NIGHT'
        this.phaseNumber = 0
        this.phaseTimeLeft = 15 // in seconds
    }

    addPlayer(socketId) {
        newPlayer = new Player(socketId)
        this.players[socketId] = newPlayer
    }

    getPlayer(socketId) {
        return this.players[socketId]
    }

    removePlayer(socketId) {
        delete this.players[socketId]
    }
}

module.exports = { GameManager }
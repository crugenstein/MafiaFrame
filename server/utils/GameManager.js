const { Player } = require('../objects/Player')

class GameManager {
    static players = {} // KEY is username, value is PLAYER object
    static sharedChats = {}

    static gameStatus = 'LOBBY_WAITING' // 'LOBBY_WAITING', 'IN_PROGRESS', or 'GAME_FINISHED'
    static phaseType = 'LOBBY' // 'LOBBY', 'DAY', or 'NIGHT'
    static phaseNumber = 0
    static phaseTimeLeft = 15 // in seconds 

    static instantiatePlayer(socketId, username) {
        if (this.players[username]) return "Username already taken!"
        const newPlayer = new Player(socketId, username)
        this.players[username] = newPlayer
    }

    static getPlayer(username) {
        return this.players[username]
    }

    static removePlayer(username) {
        delete this.players[username]
    }

    static getPlayerFromSocketId(socketId) {
        return Object.values(this.players).find(player => player.socketId === socketId) || null
    }

    static registerVisit(visitorName, targetName) {
        const visitor = this.getPlayer(visitorName)
        const target = this.getPlayer(targetName)
        if (visitor && target) {
            target.addVisitor(visitor)
        }
    }

    static clearVisits() {
        
    }
}

module.exports = { GameManager }
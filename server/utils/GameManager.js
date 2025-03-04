const { Player } = require('../objects/Player')

class GameManager {
    static players = new Map() // KEY is username, value is PLAYER object
    static sharedChats = new Map() // KEY is chatId, value is SHAREDCHAT object

    static gameStatus = 'LOBBY_WAITING' // 'LOBBY_WAITING', 'IN_PROGRESS', or 'GAME_FINISHED'
    static phaseType = 'LOBBY' // 'LOBBY', 'DAY', or 'NIGHT'
    static phaseNumber = 0
    static phaseTimeLeft = 15 // in seconds 

    static instantiatePlayer(socketId, username) {
        if (this.players.has(username)) return "Username already taken!"
        const newPlayer = new Player(socketId, username)
        this.players.set(username, newPlayer)
    }

    static getPlayer(username) {
        return this.players.get(username) || null
    }

    static removePlayer(username) {
        this.players.delete(username)
    }

    static getPlayerFromSocketId(socketId) {
        return [...this.players.values()].find(player => player.socketId === socketId) || null
    }

    static registerVisit(visitorName, targetName) {
        const visitor = this.getPlayer(visitorName)
        const target = this.getPlayer(targetName)
        if (visitor && target) {
            target.addVisitor(visitor)
        }
    }

    static clearVisits() {
        this.players.forEach((player) => {player.clearVisitors()})
    }
}

module.exports = { GameManager }
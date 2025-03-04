const { Player } = require('../objects/Player')
const { SharedChat } = require('../objects/SharedChat')
const { AbilityManager } = require('./AbilityManager')

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

    static getAlivePlayers() {
        return [...this.players.values()].filter(player => player.status === 'ALIVE')
    }

    static removePlayer(username) {
        this.players.delete(username)
    }

    static getPlayerFromSocketId(socketId) {
        return [...this.players.values()].find(player => player.socketId === socketId) || null
    }

    static registerVisit(visitor, target) {
        target.addVisitor(visitor)
    }

    static registerAttack(attacker, victim, attackStrength, specialProperties = []) {
        if (victim.getDefense() >= attackStrength) {
            victim.notif(`You were attacked, but your defense level overwhelmed the assailant!`)
            return false
        } else {
            victim.notif(`You were attacked!`)
            victim.setStatus('DEAD')
            return true
        }
    }

    static createSharedChat(chatId, readers = [], writers = []) {
        const newChat = new SharedChat(chatId)
        readers.forEach((player) => {newChat.addReader(player)})
        writers.forEach((player) => {newChat.addWriter(player)})
        this.sharedChats.set(chatId, newChat)
    }

    static clearPhaseLeftovers() {
        this.players.forEach((player) => {
            player.clearVisitors()
            player.resetDefense()
        })
    }

    static concludePhase() {
        AbilityManager.processPhaseEnd()
        if (phaseType === 'DAY') {
            const key = `DAY-${this.phaseNumber}`
            const prevDP = this.sharedChats.get(key)
            this.players.forEach((player) => {
                prevDP.revokeWrite(player)
            })
            phaseType = 'NIGHT'
        }
        else if (phaseType === 'NIGHT') {
            phaseType = 'DAY'
            this.phaseNumber++
        }
        this.startPhase()
    }

    static startPhase() {
        if (this.phaseType === 'DAY') {
            const key = `DAY-${this.phaseNumber}`
            this.createSharedChat(key, [...this.players.values()], this.getAlivePlayers())
            this.players.forEach((player) => {
                player.notif(`Welcome to Day Phase ${this.phaseNumber}!`)
            })
        }
        //OTHER PHASE START LOGIC
    }

    static startGame() {
        gameStatus = 'IN_PROGRESS'
        phaseType = 'DAY'
        phaseNumber = 1
        // ROLE DISTRIBUTION LOGIC
        this.players.forEach((player) => {
            player.setStatus('ALIVE')
        })
        this.startPhase()
    }
}

module.exports = { GameManager }
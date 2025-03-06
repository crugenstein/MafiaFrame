const { Player } = require('../objects/Player')
const { SharedChat } = require('../objects/SharedChat')
const { AbilityManager } = require('./AbilityManager')

class GameManager {
    static players = new Map() // KEY is username, value is PLAYER object
    static sharedChats = new Map() // KEY is chatId, value is SHAREDCHAT object
    static votes = new Map() // KEY is username, value is VOTE TARGET username
    static voteCounts = new Map() // KEY is username, value is voteCount

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
        return [...this.players.values()].filter(player => player.getStatus() === 'ALIVE')
    }

    static removePlayer(username) {
        this.players.delete(username)
    }

    static getPlayerFromSocketId(socketId) {
        return [...this.players.values()].find(player => player.getSocketId() === socketId) || null
    }

    static getSharedChat(chatId) {
        return this.sharedChats.get(chatId) || null
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

    static registerWhisper(sender, recipient, contents) {
        sender.setWhispers(sender.getWhisperCount() - 1)
        recipient.notif(`A whisper from ${sender.getUsername()}: ${contents}`)
    }

    static registerVote(voter, target) {
        const currentVote = this.votes.get(voter.getUsername()) || null
        if (currentVote) {
            this.revokeVote(voter)
        }
        this.votes.set(voter.getUsername(), target.getUsername())
        this.voteCounts.set(target.getUsername(), this.voteCounts.get(target.getUsername()) + 1)
        // check if enough to axe
    }

    static revokeVote(voter) {
        const currentTarget = this.votes.get(voter.getUsername())
        this.votes.get(voter.getUsername()) = null
        this.voteCounts.set(currentTarget, this.voteCounts.get(currentTarget) - 1)
        //send a message in DP saying player revoked vote
    }

    static createSharedChat(chatId, readers = [], writers = []) {
        const newChat = new SharedChat(chatId)
        readers.forEach((player) => {newChat.addReader(player.getUsername())})
        writers.forEach((player) => {newChat.addWriter(player.getUsername())})
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
                prevDP.revokeWrite(player.getUsername())
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
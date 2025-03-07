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
        return newPlayer
    }

    static getPlayer(username) {
        return this.players.get(username) || null
    }

    static getAlivePlayers() {
        return [...this.players.values()].filter(player => player.getStatus() === 'ALIVE')
    }

    static getAllUsernames() {
        return [...this.players.values()].map(player => player.getUsername())
    }

    static getAlivePlayerUsernames() {
        return [...this.players.values()].filter(player => player.getStatus() === 'ALIVE').map(player => player.getUsername())
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

    static getPhaseType() {
        return this.phaseType
    }
    
    static getPhaseNumber() {
        return this.phaseNumber
    }

    static registerVisit(visitorName, targetName) {
        const visitor = this.getPlayer(visitorName)
        const target = this.getPlayer(targetName)

        target.addVisitor(visitor)
    }

    static registerAttack(attackerName, victimName, attackStrength, specialProperties = []) {
        const attacker = this.getPlayer(attackerName)
        const victim = this.getPlayer(victimName)

        if (victim.getDefense() >= attackStrength) {
            victim.notif(`You were attacked, but your defense level overwhelmed the assailant!`)
            return false
        } else {
            victim.notif(`You were attacked!`)
            victim.setStatus('DEAD')
            return true
        }
    }

    //CLOCK RUNNING PASIVLEYTYYY

    static registerWhisper(senderName, recipientName, contents) {
        const sender = this.getPlayer(senderName)
        const recipient = this.getPlayer(recipientName)

        sender.setWhispers(sender.getWhisperCount() - 1)
        recipient.notif(`A whisper from ${senderName}: ${contents}`)
    }

    static registerVote(voterName, targetName) {
        const voter = this.getPlayer(voterName)
        const target = this.getPlayer(targetName)

        const currentVote = this.votes.get(voterName) || null
        if (currentVote) {
            this.revokeVote(voterName)
        }
        this.votes.set(voterName, targetName)
        this.voteCounts.set(targetName, this.voteCounts.get(targetName) + 1)
        // check if enough to axe
    }

    static revokeVote(voterName) {
        const voter = this.getPlayer(voterName)

        const currentTargetName = this.votes.get(voterName)
        this.voteCounts.set(currentTargetName, this.voteCounts.get(currentTargetName) - 1)
        this.votes.set(voterName, null)
        //send a message in DP saying player revoked vote
    }

    static createSharedChat(chatId, readerNames = [], writerNames = []) {
        const newChat = new SharedChat(chatId, readerNames, writerNames)
        this.sharedChats.set(chatId, newChat)
    }

    static isAlive(username) {
        const player = this.getPlayer(username)
        if (!player) return false
        else if (player.getStatus() !== 'ALIVE') return false
        return true
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
            this.createSharedChat(key, this.getAllUsernames(), this.getAlivePlayerUsernames())
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
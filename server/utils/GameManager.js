const { Player } = require('../objects/Player')
const { SharedChat } = require('../objects/SharedChat')
const { AbilityManager } = require('./AbilityManager')
const { RoleDistributor } = require('./RoleDistributor')

class GameManager {
    static players = new Map() // KEY is username, value is PLAYER object
    static sharedChats = new Map() // KEY is chatId, value is SHAREDCHAT object

    static votes = new Map() // KEY is username, value is VOTE TARGET username
    static voteCounts = new Map() // KEY is username, value is voteCount
    static votesNeededToAxe = Infinity

    static DAvotes = new Map() // same stuff as above but for mafia designated attacker
    static DAvoteCounts = new Map()
    static designatedAttackerName = null

    static gameStatus = 'LOBBY_WAITING' // 'LOBBY_WAITING', 'LOBBY_COUNTDOWN', 'ROLLOVER', 'IN_PROGRESS', or 'GAME_FINISHED'
    static phaseType = 'LOBBY' // 'LOBBY', 'DAY', or 'NIGHT'
    static phaseNumber = 0
    static phaseTimeLeft = 15 // in seconds
    static phaseLength = 150 // in seconds
    
    static gameLoopInterval = null

    static diedLastNightNames = new Set()
    
    static startGameLoop() { // HEARTBEAT RUN THIS WHEN THE PROGRAM STARTS
        if (this.gameLoopInterval) return
        this.gameLoopInterval = setInterval(() => { // THIS HAPPENS EVERY SECOND
            if (gameStatus === 'LOBBY_COUNTDOWN' || gameStatus === 'IN_PROGRESS') {
                phaseTimeLeft--
            }
            if (phaseTimeLeft <= 0) {
                if (gameStatus === 'LOBBY_COUNTDOWN' || 'IN_PROGRESS') {
                    this.nextPhase()
                }
            }
            IOManager.globalEmit('GAME_STATE_PULSE', {
                phaseType: this.phaseType,
                phaseTimeLeft: this.phaseTimeLeft,
                gameStatus: this.gameStatus,
                phaseNumber: this.phaseNumber
            }) //TODO. Add more?
        }, 1000)
    }

    static stopGameLoop() { // RUN THIS WHEN GAME CONCLUDES
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval)
            this.gameLoopInterval = null
        }
    }

    static instantiatePlayer(socketId, username) {
        if (this.players.has(username)) return "Username already taken!"
        const newPlayer = new Player(socketId, username)
        this.players.set(username, newPlayer)
        return newPlayer
    }

    static nextPhase() {
        this.gameStatus = 'ROLLOVER'
        const prevPhaseType = this.phaseType

        if (prevPhaseType === 'LOBBY') { // this should only run when the game first starts
            prevPhaseType = 'NIGHT'
            RoleDistributor.distribute()
            this.players.forEach((player) => {
                player.setStatus('ALIVE')
            })
            const mafiaList = this.getMafiaPlayerUsernames()
            this.createSharedChat('Mafia Chat', 'mafia', mafiaList, mafiaList)
            // EMIT Stuff that should be available on game start
        }
        // what we do when the night ends and the next day starts (ALTERNATIVELY when the game starts)
        if (prevPhaseType === 'NIGHT') {
            AbilityManager.processPhaseEnd()
            this.phaseNumber++
            this.phaseType = 'DAY'
            const key = `DP-${this.phaseNumber}`
            const alivePlayerList = this.getAlivePlayerUsernames()
            // update number of votes needed to axe
            if (phaseNumber === 1) {
                this.votesNeededToAxe = Math.ceil(0.75 * alivePlayerList.length)
            } else {
                this.votesNeededToAxe = Math.ceil(0.5 * alivePlayerList.length)
            }
            // make dp chat
            const newDP = this.createSharedChat(`Day Phase ${this.phaseNumber}`, key, this.getAllUsernames())
            // announce last night deaths
            this.diedLastNightNames.forEach((name) => {
                const message = {senderName: '[SERVER]', contents: `${name} died last night.`}
                newDP.addMessage(message)
            })
            // basic intro messages in dp
            newDP.addMessage({senderName: '[SERVER]', contents: `Welcome to Day Phase ${this.phaseNumber}.`})
            newDP.addMessage({senderName: '[SERVER]', contents: `There are ${alivePlayerList.length} players remaining.`})
            newDP.addMessage({senderName: '[SERVER]', contents: `It will take ${this.votesNeededToAxe} votes to Axe a player.`})
            newDP.addMessage({senderName: '[SERVER]', contents: `The Day Phase will end in ${this.phaseLength} seconds. Good luck!`})
            // basic phase cleanup
            alivePlayerList.forEach((playerName) => {
                const player = this.getPlayer(playerName)
                
                player.setWhispers(3)
                player.resetDefense()
                player.clearVisitors()
                player.setAbilitySlots(1)

                newDP.addWriter(playerName)

                this.votes.set(playerName, null)
                this.voteCounts.set(playerName, 0)
                this.DAvotes.set(playerName, null)
                this.DAvoteCounts.set(playerName, 0)
            })
            this.designatedAttackerName = null
            this.diedLastNightNames.clear()
        } else if (prevPhaseType === 'DAY') { // when the day phase ends
            const oldDP = this.getSharedChat(`DP-${this.phaseNumber}`)
            this.getAlivePlayerUsernames().forEach((playerName) => {
                oldDP.revokeWrite(playerName)
            })
            oldDP.addMessage({senderName: '[SERVER]', contents: `The Day Phase has ended. Night Phase ${this.phaseNumber} has begun!`})
            AbilityManager.processPhaseEnd()
            this.electDA()
            if (!this.isAlive(this.designatedAttackerName)) {
                // TEMP TEMP TEMP TEMP!! SHOULD BE IN ELECTING DA
            }
            this.getAlivePlayerUsernames().forEach((playerName) => {
                const player = this.getPlayer(playerName)
                player.resetDefense()
                player.clearVisitors()
                player.setAbilitySlots(1)
            })
            this.phaseType = 'NIGHT'
        }
        // no more rollover, we are done now
        this.gameStatus = 'IN_PROGRESS'
        this.phaseTimeLeft = 150
    }

    /**
     * Gets a player from a username.
     * @param {string} username - The player's username.
     * @returns {Player} The player object associated with the username. Returns null if player does not exist.
     */
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

    static getMafiaPlayerUsernames() {
        return [...this.players.values()].filter(player => player.getAlignment() === 'MAFIA').map(player => player.getUsername())
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

    static getDesignatedAttackerName() {
        return this.designatedAttackerName
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
            this.killPlayer(victimName)
            return true
        }
    }

    static killPlayer(victimName) {
        const victim = this.getPlayer(victimName)
        if (this.getPhaseType === 'NIGHT') {
            this.diedLastNightNames.add(victimName)
        }
        victim.getWriteableChatData().forEach(({name, chatId}) => {
            GameManager.getSharedChat(chatId).revokeWrite(victimName)
        })
        victim.setStatus('DEAD')
        victim.getWriteableChatData()
        victim.notif('You have died.')
    }

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
        if (this.voteCounts.get(targetName) > this.votesNeededToAxe) this.axePlayer(targetName)
    }

    static revokeVote(voterName) {
        const voter = this.getPlayer(voterName)

        const currentTargetName = this.votes.get(voterName)
        this.voteCounts.set(currentTargetName, this.voteCounts.get(currentTargetName) - 1)
        this.votes.set(voterName, null)
        //send a message in DP saying player revoked vote
    }

    static axePlayer(targetName) {
        const DP = this.getSharedChat(`DP-${this.phaseNumber}`)
        DP.addMessage({senderName: '[SERVER]', contents: `${targetName} was Axed!`})
        this.killPlayer(targetName)
        this.nextPhase()
    }

    static registerDAVote(voterName, targetName) {
        const voter = this.getPlayer(voterName)
        const target = this.getPlayer(targetName)

        const currentVote = this.DAvotes.get(voterName) || null
        if (currentVote) {
            this.revokeDAVote(voterName)
        }
        this.DAvotes.set(voterName, targetName)
        this.DAvoteCounts.set(targetName, this.DAvoteCounts.get(targetName) + 1)
        // send a message in mafia chat about this prolly
    }

    static revokeDAVote(voterName) {
        const voter = this.getPlayer(voterName)

        const currentTargetName = this.DAvotes.get(voterName)
        this.DAvoteCounts.set(currentTargetName, this.DAvoteCounts.get(currentTargetName) - 1)
        this.DAvotes.set(voterName, null)
        //send a message in DP saying player revoked vote
    }

    static electDA() { // THIS NEEDS BETTER LOGIC IN CASE THE PERSON IS DEAD
        let maxVotes = -Infinity
        let maxVoters = new Set()

        this.DAvoteCounts.forEach((voteCount, username) => {
            if (voteCount > maxVotes) {
                maxVotes = voteCount;
                maxVoters.clear()
                maxVoters.add(username)
            } else if (voteCount === maxVotes) {
                maxVoters.add(username)
            }
        })

        const maxVoterArray = Array.from(maxVoters);
        this.designatedAttackerName = maxVoterArray[Math.floor(Math.random() * maxVoterArray.length)]
        const DA = this.getPlayer(this.designatedAttackerName)
        DA.notif(`You have been selected as the Mafia's Designated Attacker.`) // temp
    }

    static createSharedChat(name, chatId, readerNames = [], writerNames = []) {
        const newChat = new SharedChat(name, chatId, readerNames, writerNames)
        this.sharedChats.set(chatId, newChat)
        return newChat
    }

    static isAlive(username) {
        const player = this.getPlayer(username)
        if (!player) return false
        else if (player.getStatus() !== 'ALIVE') return false
        return true
    }

}

module.exports = { GameManager }
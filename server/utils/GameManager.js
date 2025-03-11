const { IOManager } = require('../io/IOManager')
const { Player } = require('../objects/Player')
const { SharedChat } = require('../objects/SharedChat')
const { AbilityManager } = require('./AbilityManager')
const { RoleDistributor } = require('./RoleDistributor')

const GameStatus = Object.freeze({
    LOBBY_WAITING: 0,
    LOBBY_COUNTDOWN: 1,
    ROLLOVER: 2,
    IN_PROGRESS: 3,
    GAME_FINISHED: 4
})

const PhaseType = Object.freeze({
    LOBBY: 0,
    DAY: 1,
    NIGHT: 2
})

class GameManager {
    static _gameLoopInterval = null

    static _phaseType = PhaseType.LOBBY
    static _gameStatus = GameStatus.LOBBY_WAITING

    static _phaseNumber = 0
    static _phaseTimeLeft = 15 // in seconds
    static _phaseLength = 150 // in seconds

    static _playerNameMap = new Map() // key: unique player name string, value is player object
    static _playerSocketMap = new Map() // key: unique player socketid string, value is player name

    static _sharedChats = new Map() // key: unique sharedchat id, value is sharedchat object

    /**
    * Keys are player names (strings) and values are vote data objects.
    * @type {Map<string, {votedFor: string|null, votesReceived: number, DAVotedFor: string|null, DAvotesReceived: number}>}
    */
    static _voteMap = new Map()
    static _votesNeededToAxe = Infinity // how many votes to axe someone?
    static _designatedAttacker = null // the name of the designated attacker

    static diedLastNightNames = new Set()
    
    static startGameLoop() { // Run when game starts
        if (this.gameLoopInterval) return
        this.gameLoopInterval = setInterval(() => {
            if (this.gameStatus === GameStatus.LOBBY_COUNTDOWN || this.gameStatus === GameStatus.IN_PROGRESS) {
                this.phaseTimeLeft--
                if (this.phaseTimeLeft <= 0) {
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

    static stopGameLoop() { // Run when game ends
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval)
            this.gameLoopInterval = null
        }
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
            this.players.forEach((player) => {
                this.distributeGameData(player.getUsername())
            })
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
            this.getAlivePlayerUsernames().forEach((playerName) => {
                const player = this.getPlayer(playerName)
                player.resetDefense()
                player.clearVisitors()
                player.setAbilitySlots(1)
            })
            this.phaseType = 'NIGHT'
        }
        // WIN CONDITION CHECK (major todo)
        if (this.getMafiaPlayerUsernames().length < 1) {
            this.globalEmit('TOWN_VICTORY', {})
            this.gameStatus = 'GAME_FINISHED'
            this.phaseType = 'LOBBY'
        } else if (this.getAlivePlayerUsernames().length < this.getMafiaPlayerUsernames().length + 1) {
            this.globalEmit('MAFIA_VICTORY', {})
            this.gameStatus = 'GAME_FINISHED'
            this.phaseType = 'LOBBY'
        } else {
            this.gameStatus = 'IN_PROGRESS' // no more rollover, we are done now
            this.phaseTimeLeft = 150
        }
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
        return [...this.players.values()].filter(player => (player.getAlignment() === 'MAFIA' && player.getStatus() === 'ALIVE')).map(player => player.getUsername())
    }

    static removePlayer(username) {
        this.players.delete(username)
    }

    static getSharedChat(chatId) {
        return this.sharedChats.get(chatId) || null
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
        this.getAlivePlayerUsernames().forEach((username) => {
            IOManager.emitToPlayer(username, 'PLAYER_DIED', {victimName})
        })
    }

    static registerWhisper(senderName, recipientName, contents) {
        const sender = this.getPlayer(senderName)
        const recipient = this.getPlayer(recipientName)

        sender.setWhispers(sender.getWhisperCount() - 1)
        recipient.notif(`A whisper from ${senderName}: ${contents}`)
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
        this.getMafiaPlayerUsernames().forEach((username) => {
            IOManager.emitToPlayer(username, 'DA_VOTE_UPDATE', {voteCountMap: this.DAvoteCounts})
        })
        // send a message in mafia chat about this prolly
    }

    static revokeDAVote(voterName) {
        const voter = this.getPlayer(voterName)

        const currentTargetName = this.DAvotes.get(voterName)
        this.DAvoteCounts.set(currentTargetName, this.DAvoteCounts.get(currentTargetName) - 1)
        this.DAvotes.set(voterName, null)
    }

    static electDA() {
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
        if (!this.isAlive(this.designatedAttackerName)) {
            this.designatedAttackerName = this.getMafiaPlayerUsernames()[Math.floor(Math.random() * this.getMafiaPlayerUsernames().length)]
        }
        const DA = this.getPlayer(this.designatedAttackerName)
        DA.notif(`You have been selected as the Mafia's Designated Attacker.`) // temp
    }

    static isAlive(username) {
        const player = this.getPlayer(username)
        if (!player) return false
        else if (player.getStatus() !== 'ALIVE') return false
        return true
    }

    static distributeGameData(username) {
        const player = GameManager.getPlayer(username)
        const data = {
            username,
            alivePlayers: this.getAlivePlayerUsernames(),
            roleName: player.getRoleName(),
            mafia: player.getAlignment() === 'MAFIA' ? this.getMafiaPlayerUsernames() : [],
            DA: player.getAlignment() === 'MAFIA' ? this.getDesignatedAttackerName() : null
        }

        IOManager.emitToPlayer(username, 'REQUEST_GAME_DATA', {
            gameData: data
        })
    }

    /**
    * Instantiates a new Player object and registers it within the GameManager. Broadcasts the creation event with
    * payload containing the player's public data.
    * 
    * @param {string} socketId - The socket ID of the player.
    * @param {string} username - The username of the player.
    * @returns {Player|null} - Returns the newly created Player object or null if the username or socket are occupied.
    */
    static instantiatePlayer(socketId, username) {
        if (this._playerNameMap.has(username)) return null
        if (this._playerSocketMap.has(socketId)) return null

        const newPlayer = new Player(socketId, username)

        this._playerNameMap.set(username, newPlayer)
        this._playerSocketMap.set(socketId, newPlayer)

        const publicData = newPlayer.publicData
        IOManager.globalEmit('PLAYER_JOIN', {playerData: publicData})

        return newPlayer
    }

    /**
    * Gets a Player by username.
    * 
    * @param {string} username - The username of the player.
    * @returns {Player|null} - Returns the Player if it exists and null otherwise.
    */
    static getPlayer(username) {
        return this._playerNameMap.get(username) || null
    }

    /**
    * Gets a Player by socket ID.
    * 
    * @param {string} socketId - The socketId of the player.
    * @returns {Player|null} - Returns the Player if it exists and null otherwise.
    */
    static getPlayerFromSocketId(socketId) {
        return this._playerSocketMap.get(socketId) || null
    }

    /**
    * Creates a new Shared Chat object given an ID and display name.
    * 
    * @param {string} chatId - The unique ID of the Shared Chat.
    * @param {string} displayName - The display name of the Shared Chat.
    * @param {string} [readers] - A list of usernames to grant read access to.
    * @param {string} [writers] - A list of usernames to grant write access to.
    * @returns {SharedChat|null} - Returns the newly created Shared Chat object or null if the id is occupied.
    */
    static createSharedChat(chatId, displayName, readers = [], writers = []) {
        if (this._sharedChats.has(chatId)) return null

        const newChat = new SharedChat(chatId, displayName, readers, writers)
        this._sharedChats.set(chatId, newChat)

        return newChat
    }

    /**
    * Registers a generic Day Phase vote. Checks if conditions are met to Axe a target.
    * 
    * @param {string} voterName - The name of the player casting the vote.
    * @param {string|null} targetName - The name of the target. If null, represents a revoked vote.
    */
    static registerVote(voterName, targetName) {
        if (!this.isAlive(voterName)) {
            console.error("Non-alive or nonexistent player attempted to cast vote.")
            return
        }
        
        const voterData = this._voteMap.get(voterName)
        const oldTarget = voterData.votedFor
        let newTargetData = null

        if (oldTarget) {
            const oldTargetData = this._voteMap.get(oldTarget)
            oldTargetData.votesReceived--
            this._voteMap.set(oldTarget, oldTargetData)
        }

        voterData.votedFor = null

        if (targetName) {
            if (!this.isAlive(targetName)) {
                console.error("Player attempted to vote for non-alive target")
                return
            }
            newTargetData = this._voteMap.get(targetName)
            newTargetData.votesReceived++
            voterData.votedFor = targetName

            this._voteMap.set(targetName, newTargetData)
        }

        this._voteMap.set(voterName, voterData)
        IOManager.globalEmit('VOTE_CAST', {newVoteTarget: targetName, previousVoteTarget: oldTarget})
        if (newTargetData && (newTargetData.votesReceived > this._votesNeededToAxe)) {
            this.axePlayer(targetName)
        }
    }

    /**
    * Sets the Phase Type and broadcasts the change.
    * 
    * @param {number} type - The new phase type. Use the PhaseType enum in GameManager.
    */
    static set phaseType(type) {
        this._phaseType = type
        IOManager.globalEmit('PHASE_TYPE_UPDATE', {phaseType: type})
    }

    static get phaseType() {return this._phaseType}

    /**
    * Sets the Game Status and broadcasts the change.
    * 
    * @param {number} status - The new status. Use the GameStatus enum in GameManager.
    */
    static set gameStatus(status) {
        this._gameStatus = status
        IOManager.globalEmit('GAME_STATUS_UPDATE', {gameStatus: status})
    }

    static get gameStatus() {return this._gameStatus}

    /**
    * Sets the Phase Number and broadcasts the change.
    * 
    * @param {number} type - The Phase Type. Use the PhaseType enum in GameManager.
    */
    static set phaseNumber(number) {
        this._phaseNumber = number
        IOManager.globalEmit('PHASE_NUMBER_UPDATE', {phaseNumber: number})
    }

    static get phaseNumber() {return this._phaseNumber}

    /**
    * Sets the Phase Time Left and broadcasts the change.
    * 
    * @param {number} time - The time left in the current phase in seconds.
    */
    static set phaseTimeLeft(time) {
        this._phaseTimeLeft = time
        IOManager.globalEmit('PHASE_TIME_LEFT_UPDATE', {phaseTimeLeft: time})
    }

    static get phaseLength() {return this._phaseLength}

    /**
    * Sets the Phase Length.
    * 
    * @param {number} length - The new phase length in seconds.
    */
    static set phaseLength(length) {
        this._phaseLength = length
    }

}

module.exports = { GameManager }
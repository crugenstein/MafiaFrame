const { IOManager } = require('../io/IOManager')
const { Player, PlayerStatus, PlayerAlignment, NotificationType } = require('../objects/Player')
const { SharedChat, MessageType } = require('../objects/SharedChat')
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
    static _phaseTimeLeft = 15
    static _phaseLength = 150

    /**
    * Keys are player names (strings) and values are Player objects.
    * @type {Map<string, Player>}
    */
    static _playerNameMap = new Map()

    /**
    * Keys are socket IDs and values are Player objects.
    * @type {Map<string, Player>}
    */
    static _playerSocketMap = new Map()

    /**
    * Keys are chat IDs and values are SharedChat objects.
    * @type {Map<string, SharedChat>}
    */
    static _sharedChats = new Map()

    /**
    * Keys are phase numbers and values are SharedChat objects corresponding to each Day Phase chat.
    * @type {Map<number, SharedChat>}
    */
    static _dayPhaseChats = new Map()
    
    /** @type {SharedChat} */
    static _mafiaChat = null

    /** @type {SharedChat} */
    static _lobbyChat = null

    /**
    * Keys are player names (strings) and values are vote data objects.
    * @type {Map<string, {votedFor: string|null, votesReceived: number, DAvotedFor: string|null, DAvotesReceived: number}>}
    */
    static _voteMap = new Map()

    /**
    * Number of votes needed to Axe a player.
    * @type {number}
    */
    static _votesNeededToAxe = Infinity

    /** @type {string} */
    static _designatedAttacker = null

    /** @type {Set<string>} */
    static _diedLastNight = new Set()
    
    /** Run this when the server starts. Starts the "internal clock" that pulses every second. */
    static startGameLoop() {
        if (this._gameLoopInterval) return
        this._lobbyChat = new SharedChat('lobby')

        this._gameLoopInterval = setInterval(() => {
            if (this.gameStatus === GameStatus.LOBBY_COUNTDOWN || this.gameStatus === GameStatus.IN_PROGRESS) {
                this.phaseTimeLeft = this.phaseTimeLeft - 1
                if (this.phaseTimeLeft <= 0) {
                    if (this.phaseType === PhaseType.DAY) {this.endDayPhase()}
                    else if (this.phaseType === PhaseType.NIGHT) {this.endNightPhase()}
                    else if (this.phaseType === PhaseType.LOBBY) {this.startGame()}
                }
            }
        }, 1000)
    }

    /** Stops the internal clock. Run this when the game ends. */
    static stopGameLoop() {
        if (this._gameLoopInterval) {
            clearInterval(this._gameLoopInterval)
            this._gameLoopInterval = null
        }
    }

    /** Starts the lobby countdown. */
    static startLobbyCountdown() {
        this.gameStatus = GameStatus.LOBBY_COUNTDOWN
    }

    /** Transitions from lobby to first day phase. */
    static startGame() {
        this.gameStatus = GameStatus.ROLLOVER
        RoleDistributor.distribute()

        this._playerNameMap.values().forEach((player) => {
            player.status = PlayerStatus.ALIVE
        })

        const mafia = this.aliveMafia
        this._mafiaChat = this.createSharedChat('Mafia Chat', mafia, mafia)
        
        this.endNightPhase(false)
    }

    /** Ends the current Day Phase and starts the next Night Phase. */
    static endDayPhase() {
        this.gameStatus = GameStatus.ROLLOVER
        AbilityManager.processPhaseEnd()

        if (this.checkWinConditions()) return

        this.phaseType = PhaseType.NIGHT

        const prevDP = this.getDayPhaseChat()
        prevDP.writeLock()

        this.electDA()
        this.phaseEndCleanup()

        this.allPlayers.forEach((playerName) => {
            const player = this.getPlayer(playerName)
            player.clientGameStateUpdate()
        })

        prevDP.addMessage(MessageType.SERVER, '[SERVER]', `The Day Phase has ended. Night Phase ${this.phaseNumber} has begun!`)

        this.gameStatus = GameStatus.IN_PROGRESS
        this.phaseTimeLeft = 150
    }

    /**
    * Ends the current Night Phase and starts the next Day Phase.
    * @param {boolean} doAbilityQueue - Whether or not to run the queued abilities. Do not do it when starting the game.
    */
    static endNightPhase(doAbilityQueue) {
        this.gameStatus = GameStatus.ROLLOVER
        if (doAbilityQueue) {AbilityManager.processPhaseEnd()}

        if (this.checkWinConditions()) return

        this.phaseType = PhaseType.DAY
        this.phaseNumber = this.phaseNumber + 1

        if (this.phaseNumber === 1) {this._votesNeededToAxe = Math.ceil(0.75 * this.alivePlayerCount)}
        else {this._votesNeededToAxe = Math.ceil(0.5 * this.alivePlayerCount)}

        const DP = this.createSharedChat(`Day Phase ${this.phaseNumber}`, this.allPlayers, this.alivePlayers)
        this._dayPhaseChats.set(this.phaseNumber, DP)

        this.phaseEndCleanup()
        this.designatedAttacker = null

        this.allPlayers.forEach((playerName) => {
            const player = this.getPlayer(playerName)
            player.clientGameStateUpdate()
        })

        DP.addMessage(MessageType.SERVER, '[SERVER]', `Welcome to Day Phase ${this.phaseNumber}.`)
        this.diedLastNight.forEach((recentDeathName) => {
            DP.addMessage(MessageType.SERVER, '[SERVER]', `${recentDeathName} died last night.`)
        })
        DP.addMessage(MessageType.SERVER, '[SERVER]', `There are ${this.alivePlayerCount} players remaining.`)
        DP.addMessage(MessageType.SERVER, '[SERVER]', `It will take ${this._votesNeededToAxe} votes to Axe a player.`)
        DP.addMessage(MessageType.SERVER, '[SERVER]', `The Day Phase ends in ${this._phaseLength} seconds. Good luck!`)

        this._diedLastNight.clear()

        this.gameStatus = GameStatus.IN_PROGRESS
        this.phaseTimeLeft = 150
    }
    
    /**
    * Checks player win conditions and acts accordingly.
    * @returns {boolean} - Whether or not a game-ending Win Condition has been reached.
    */
    static checkWinConditions() {
        if (this.aliveMafiaCount + 1 > this.alivePlayerCount) {
            this.endGame('MAFIA VICTORY')
            return true
        } else if (this.aliveMafiaCount === 0) {
            this.endGame('TOWN VICTORY')
            return true
        } else {
            return false
        }
    }
    
    /**
    * Ends the game and broadcasts the result.
    * @param {string} endState - (TEMP) the state that caused the game to end.
    */
    static endGame(endState) {
        this.gameStatus = GameStatus.GAME_FINISHED
        this.stopGameLoop()
        IOManager.globalEmit('GAME_END', { endState })
    }

    /**
    * Instantiates a new Player object and registers it within the GameManager. Broadcasts the creation event with
    * payload containing the player's public data.
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
    * @param {string} username - The username of the player.
    * @returns {Player|null} - Returns the Player if it exists and null otherwise.
    */
    static getPlayer(username) {
        return this._playerNameMap.get(username) || null
    }

    /**
    * Gets a Player by socket ID.
    * @param {string} socketId - The socketId of the player.
    * @returns {Player|null} - Returns the Player if it exists and null otherwise.
    */
    static getPlayerFromSocketId(socketId) {
        return this._playerSocketMap.get(socketId) || null
    }

    /** Player data cleanup helper function. Sets values to what they "should be" after phase end. */
    static phaseEndCleanup() {
        this.allPlayers.forEach((playerName) => {
            const player = this.getPlayer(playerName)

            this._voteMap.set(playerName, {votedFor: null, votesReceived: 0, DAvotedFor: null, DAvotesReceived: 0})

            player.whispers = 3
            player.abilitySlots = 1
            player.visitors.clear()
            player.resetDefense()
        })
    }

    /**
    * Gets a Shared Chat by chatId.
    * @param {string} chatId - The id of the SharedChat.
    * @returns {SharedChat|null} - Returns the SharedChat if it exists and null otherwise.
    */
    static getSharedChat(chatId) {
        return this._sharedChats.get(chatId) || null
    }
    
    /**
    * Gets Day Phase Shared Chat.
    * @param {number} [dayNumber] - Which Day Phase chat to retrieve. Defaults to current Day.
    * @returns {SharedChat|null} - Returns the SharedChat if it exists and null otherwise.
    */
    static getDayPhaseChat(dayNumber = this.phaseNumber) {
        return this._dayPhaseChats.get(dayNumber) || null
    }

    /**
    * Checks whether the username corresponds to an alive player.
    * @param {string} username - The username of the player.
    * @returns {boolean} - Whether or not the username corresponds to an alive player.
    */
    static isAlive(username) {
        const player = this.getPlayer(username)

        if (!player) return false
        else if (player.status !== PlayerStatus.ALIVE) return false

        return true
    }

    /**
    * Checks whether the username corresponds to an alive Mafia player.
    * @param {string} username - The username of the player.
    * @returns {boolean} - Whether or not the username corresponds to an alive Mafia player.
    */
    static isAliveMafia(username) {
        const player = this.getPlayer(username)

        if (!player) return false
        else if (player.status !== PlayerStatus.ALIVE || player.alignment !== PlayerAlignment.MAFIA) return false

        return true
    }

    /**
    * Creates a new Shared Chat object given a display name.
    * @param {string} displayName - The display name of the Shared Chat.
    * @param {Array<string>} [readers] - A list of usernames to grant read access to.
    * @param {Array<string>} [writers] - A list of usernames to grant write access to.
    * @returns {SharedChat} - Returns the newly created Shared Chat object.
    */
    static createSharedChat(displayName, readers = [], writers = []) {
        const newChat = new SharedChat(displayName, readers, writers)
        this._sharedChats.add(newChat.id, newChat)

        return newChat
    }

    /**
    * Registers a generic Day Phase vote. Checks if conditions are met to Axe a target.
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

        const DP = this.getDayPhaseChat()
        DP.addMessage(MessageType.VOTE, '[SERVER]', `${voterName} has voted for ${targetName}. They now have ${newTargetData.votesReceived} vote(s).`)

        if (newTargetData && (newTargetData.votesReceived > this._votesNeededToAxe)) {
            this.axePlayer(targetName)
        }
    }
    
    /**
    * Axes a player and concludes the current Day Phase.
    * @param {string} victimName - The name of the player to be Axed.
    */
    static axePlayer(targetName) {
        if (!this.isAlive(targetName)) {
            console.error("Server attempted to axe non-alive player.")
            return
        }
        const DP = this.getDayPhaseChat()
        DP.addMessage(MessageType.SERVER, '[SERVER]', `${targetName} was Axed!`)

        this.killPlayer(targetName)

        this.endDayPhase()
    }

    /**
    * Attacks a player, killing them if fatal.
    * @param {string} attackerName - The name of the player dealing the attack.
    * @param {string} victimName - The name of the attack target.
    * @param {number} attackStrength - The strength of the attack.
    * @param {Array<number>} [specialProperties] - Any special attack properties. (IMPLEMENT LATER)
    * @returns {boolean} - Whether or not the attack was fatal.
    */
    static registerAttack(attackerName, victimName, attackStrength, specialProperties = []) {
        const attacker = this.getPlayer(attackerName)
        const victim = this.getPlayer(victimName)

        if (victim.defense >= attackStrength) {
            victim.notif(NotificationType.ABILITY_RESULT, `You were attacked, but your defense level overwhelmed the assailant!`)
            return false
        } else {
            victim.notif(NotificationType.ABILITY_RESULT, `You were attacked!`)
            this.killPlayer(victimName)
            return true
        }
    }

    /**
    * Kills a player, broadcasting the event and updating the list of players who died during the current phase.
    * @param {string} victimName - The name of the player to be killed.
    */
    static killPlayer(victimName) {
        if (!this.isAlive(victimName)) return // this might happen if the player is killed multiple times per phase transition

        const victim = this.getPlayer(victimName)
        victim.status = PlayerStatus.DEAD

        if (this.phaseType === PhaseType.NIGHT) {
            this._diedLastNight.add(victimName)
        }

        IOManager.globalEmit('PLAYER_DIED', {death: victimName})
        victim.notif(NotificationType.ABILITY_RESULT, 'You have died.')
    }

    /**
    * Registers a visit between players.
    * @param {string} visitorName - The name of the visitor.
    * @param {string} targetName - The player being visited.
    */
    static registerVisit(visitorName, targetName) {
        const target = this.getPlayer(targetName)
        target.visitors.add(visitorName)
    }

    /**
    * Registers a whisper between players.
    * @param {string} senderName - The name of the whisperer.
    * @param {string} recipientName - The player being whispered.
    * @param {string} contents - The contents of the whisper.
    */
    static registerWhisper(senderName, recipientName, contents) {
        const sender = this.getPlayer(senderName)
        const recipient = this.getPlayer(recipientName)

        if (sender.whispers < 1) return
        sender.whispers = sender.whispers - 1

        recipient.notif(NotificationType.WHISPER, `A whisper from ${senderName}: ${contents}`)
    }

    /**
    * Registers a Designated Attacker vote.
    * @param {string} voterName - The name of the player casting the vote.
    * @param {string|null} targetName - The name of the target. If null, represents a revoked vote.
    */
    static registerDAvote(voterName, targetName) {
        if (!this.isAlive(voterName) || !this.isMafia(voterName)) {
            console.error("Non-alive or nonexistent or non-mafia player attempted to cast DA vote.")
            return
        }
        
        const voterData = this._voteMap.get(voterName)
        const oldTarget = voterData.DAvotedFor
        let newTargetData = null

        if (oldTarget) {
            const oldTargetData = this._voteMap.get(oldTarget)
            oldTargetData.DAvotesReceived--
            this._voteMap.set(oldTarget, oldTargetData)
        }

        voterData.DAvotedFor = null

        if (targetName) {
            if (!this.isAliveMafia(targetName)) {
                console.error("Player attempted to DA-vote for non-alive or nonexistent or non-mafia target")
                return
            }
            newTargetData = this._voteMap.get(targetName)
            newTargetData.DAvotesReceived++
            voterData.DAvotedFor = targetName

            this._voteMap.set(targetName, newTargetData)
        }

        this._voteMap.set(voterName, voterData)
        IOManager.emitToMafia('DA_VOTE_CAST', {newVoteTarget: targetName, previousVoteTarget: oldTarget})

        this.mafiaChat.addMessage(MessageType.VOTE, '[SERVER]', `${voterName} has DA-voted for ${targetName}. They now have ${newTargetData.DAvotesReceived} vote(s).`)
    }
    
    /**
    * Elects and updates the Designated Attacker property. Chooses randomly between tied players.
    * Notifies the Designated Attacker when they are chosen and broadcasts this event to the Mafia.
    */
    static electDA() {
        let maxVotes = -Infinity
        let maxVoters = new Set()

        this._voteMap.forEach((voteData, dataOwnerName) => {
            if (this.isAliveMafia(dataOwnerName)) {
                const votesReceived = voteData.DAvotesReceived
                if (votesReceived > maxVotes) {
                    maxVotes = votesReceived
                    maxVoters.clear()
                    maxVoters.add(dataOwnerName)
                } else if (votesReceived === maxVotes) {
                    maxVoters.add(dataOwnerName)
                }
            }
        })

        const maxVoterArray = Array.from(maxVoters)
        this.designatedAttacker = maxVoterArray[Math.floor(Math.random() * maxVoterArray.length)]
    }

    /**
    * Returns an array of alive player usernames.
    * @returns {Array<string>} - An array of alive player usernames.
    */
    static get alivePlayers() {return [...this._playerNameMap.values()].filter(player => player.status === PlayerStatus.ALIVE)}

    /**
    * Returns an array of alive Mafia player usernames.
    * @returns {Array<string>} - An array of alive Mafia player usernames.
    */
    static get aliveMafia() {return [...this._playerNameMap.values()].filter(player => (player.status === PlayerStatus.ALIVE && player.alignment === PlayerAlignment.MAFIA))}
  
    /**
    * Returns an array of all player usernames.
    * @returns {Array<string>} - An array of player usernames.
    */
    static get allPlayers() {return [...this._playerNameMap.values()]}

    /**
    * Returns the Mafia Shared Chat object.
    * @returns {SharedChat} - Mafia Chat object.
    */
    static get mafiaChat() {return this._mafiaChat}

    /**
    * Returns the Lobby Shared Chat object.
    * @returns {SharedChat} - Lobby Chat object.
    */
    static get lobbyChat() {return this._lobbyChat}

    /**
    * Sets the Phase Type and broadcasts the change.
    * @param {number} type - The new phase type. Use the PhaseType enum in GameManager.
    */
    static set phaseType(type) {
        this._phaseType = type
        IOManager.globalEmit('PHASE_TYPE_UPDATE', {phaseType: type})
    }

    /**
    * Returns the Phase Type.
    * @returns {number} - The Phase Type. Refer to GameManager enum for translation.
    */
    static get phaseType() {return this._phaseType}

    /**
    * Sets the Game Status and broadcasts the change.
    * @param {number} status - The new status. Use the GameStatus enum in GameManager.
    */
    static set gameStatus(status) {
        this._gameStatus = status
        IOManager.globalEmit('GAME_STATUS_UPDATE', {gameStatus: status})
    }

    /**
    * Returns the Game Status.
    * @returns {number} - The Game Status. Refer to GameManager enum for translation.
    */
    static get gameStatus() {return this._gameStatus}

    /**
    * Sets the Phase Number and broadcasts the change.
    * @param {number} number - The Phase number.
    */
    static set phaseNumber(number) {
        this._phaseNumber = number
        IOManager.globalEmit('PHASE_NUMBER_UPDATE', {phaseNumber: number})
    }

    /**
    * Returns the Phase Number.
    * @returns {number} - The current phase number.
    */
    static get phaseNumber() {return this._phaseNumber}

    /**
    * Sets the Phase Time Left and broadcasts the change.
    * @param {number} time - The time left in the current phase in seconds.
    */
    static set phaseTimeLeft(time) {
        this._phaseTimeLeft = time
        IOManager.globalEmit('PHASE_TIME_LEFT_UPDATE', {phaseTimeLeft: time})
    }

    /**
    * Returns the time remaining in the phase, in seconds.
    * @returns {number} - Remaining phase time, in seconds.
    */
    static get phaseTimeLeft() {return this._phaseTimeLeft}

    /**
    * Sets the Phase Length.
    * @param {number} length - The new phase length in seconds.
    */
    static set phaseLength(length) {
        this._phaseLength = length
    }

    /**
    * Returns the Phase Length.
    * @returns {number} - The phase length, in seconds.
    */
    static get phaseLength() {return this._phaseLength}

    /**
    * Returns the username of the Designated Attacker.
    * @returns {string|null} - The name of the Designated Attacker or null if there is no Designated Attacker.
    */
    static get designatedAttacker() {return this._designatedAttacker}

    /**
    * Sets the username of the Designated Attacker and notifies the Mafia of the change. Also sends a notifcation to the new DA.
    * @param {string|null} name - The name of the new Designated Attacker. If null, we are "resetting" the DA.
    */
    static set designatedAttacker(name) {
        if (name !== null && !this.isAliveMafia(name)) {
            console.error('Designated Attacker cannot be set to a player who is not an alive Mafia member')
            return
        }

        this._designatedAttacker = name
        IOManager.emitToMafia('DA_UPDATE', {DA: name})

        if (name === null) return

        const DA = this.getPlayer(name)
        DA.notif(NotificationType.SERVER, `You have been chosen as the Mafia's Designated Attacker.`)
    }
    
    /**
    * Returns an array of players who died during the previous Night Phase.
    * @returns {Array<string>} - An array of recently deceased player names.
    */
    static get diedLastNight() {return Array.from(this._diedLastNight)}
        
    /**
    * Returns the number of alive players.
    * @returns {number} - The number of alive players.
    */
    static get alivePlayerCount() {return this.alivePlayers.length}

    /**
    * Returns the number of alive Mafia players.
    * @returns {number} - The number of alive Mafia players.
    */
    static get aliveMafiaCount() {return this.aliveMafia.length}

}

module.exports = { GameManager, GameStatus, PhaseType }
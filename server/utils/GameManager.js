const { GameStatus, PhaseType, PlayerStatus, PlayerAlignment, NotificationType, MessageType } = require('../data/enums')
const { IOManager } = require('../io/IOManager')
const { Player } = require('../objects/Player')
const { SharedChat } = require('../objects/SharedChat')
const { AbilityManager } = require('./AbilityManager')
const { RoleDistributor } = require('./RoleDistributor')

class GameManager {

    constructor() {
        if (GameManager.instance) {return GameManager.instance}
        
        GameManager.instance = this

        this._gameLoopInterval = null
        this._hasAdmin = false

        this._phaseType = PhaseType.LOBBY
        this._gameStatus = GameStatus.LOBBY_WAITING

        this._phaseNumber = 0
        this._phaseTimeLeft = 2 // CHANGE BACK FOR DEBUG
        this._phaseLength = 150

        /**
        * Keys are player names (strings) and values are Player objects.
        * @type {Map<string, Player>}
        */
        this._playerNameMap = new Map()

        /**
        * Keys are socket IDs and values are Player objects.
        * @type {Map<string, Player>}
        */
        this._playerSocketMap = new Map()

        /**
        * Keys are chat IDs and values are SharedChat objects.
        * @type {Map<string, SharedChat>}
        */
        this._sharedChats = new Map()

        /**
        * Keys are phase numbers and values are SharedChat objects corresponding to each Day Phase chat.
        * @type {Map<number, SharedChat>}
        */
        this._dayPhaseChats = new Map()
        
        /** @type {SharedChat} */
        this._mafiaChat = null

        /** @type {SharedChat} */
        this._lobbyChat = null

        /**
        * Keys are player names (strings) and values are vote data objects.
        * @type {Map<string, {votedFor: string|null, votesReceived: number, DAvotedFor: string|null, DAvotesReceived: number}>}
        */
        this._voteMap = new Map()

        /**
        * Number of votes needed to Axe a player.
        * @type {number}
        */
        this._votesNeededToAxe = Infinity

        /** @type {string} */
        this._designatedAttacker = null
        
        /** @type {Set<string>} */
        this._diedLastNight = new Set()
    }

    /** @returns {GameManager} */
    static getInstance() {
        if (!GameManager.instance) {GameManager.instance = new GameManager()}
        return GameManager.instance
    }

    /** Run this when the server starts. Starts the "internal clock" that pulses every second. */
    startGameLoop() {
        if (this._gameLoopInterval) return
        this._lobbyChat = this.createSharedChat('Game Lobby')

        this._gameLoopInterval = setInterval(() => {
            if (this.gameStatus === GameStatus.LOBBY_COUNTDOWN || this.gameStatus === GameStatus.IN_PROGRESS) {
                this.phaseTimeLeft = this.phaseTimeLeft - 1
                if (this.gameStatus === GameStatus.LOBBY_COUNTDOWN && this.phaseTimeLeft > 0) {this.lobbyChat.addMessage(MessageType.SERVER, '[SERVER]', `Game starts in ${this.phaseTimeLeft} seconds...`)}
                if (this.phaseTimeLeft <= 0) {
                    if (this.phaseType === PhaseType.DAY) {this.endDayPhase()}
                    else if (this.phaseType === PhaseType.NIGHT) {this.endNightPhase(true)}
                    else if (this.phaseType === PhaseType.LOBBY) {this.startGame()}
                }
            }
        }, 1000)
    }

    /** Stops the internal clock. Run this when the game ends. */
    stopGameLoop() {
        if (this._gameLoopInterval) {
            clearInterval(this._gameLoopInterval)
            this._gameLoopInterval = null
        }
    }

    /** Starts the lobby countdown. */
    startLobbyCountdown() {
        this.gameStatus = GameStatus.LOBBY_COUNTDOWN
    }

    /** Transitions from lobby to first day phase. */
    startGame() {
        console.log('game start!!')
        this.gameStatus = GameStatus.ROLLOVER
        RoleDistributor.distribute(GameManager.getInstance())

        this.allPlayers.forEach((playerName) => {
            const player = this.getPlayer(playerName)
            player.status = PlayerStatus.ALIVE
            this.lobbyChat.revokeRW(playerName)
        })

        const mafia = this.aliveMafia
        this._mafiaChat = this.createSharedChat('Mafia Chat', mafia, mafia)
        
        this.endNightPhase(false)
    }

    /** Ends the current Day Phase and starts the next Night Phase. */
    endDayPhase() {
        this.gameStatus = GameStatus.ROLLOVER
        AbilityManager.processPhaseEnd()

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
        
        if (this.checkWinConditions()) return
        this.gameStatus = GameStatus.IN_PROGRESS
        this.phaseTimeLeft = 150
    }

    /**
    * Ends the current Night Phase and starts the next Day Phase.
    * @param {boolean} doAbilityQueue - Whether or not to run the queued abilities. Do not do it when starting the game.
    */
    endNightPhase(doAbilityQueue) {
        this.gameStatus = GameStatus.ROLLOVER
        if (doAbilityQueue) {AbilityManager.processPhaseEnd()}

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
        if (this.checkWinConditions()) return

        this.gameStatus = GameStatus.IN_PROGRESS
        this.phaseTimeLeft = 150
    }
    
    /**
    * Checks player win conditions and acts accordingly.
    * @returns {boolean} - Whether or not a game-ending Win Condition has been reached.
    */
    checkWinConditions() {
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
    endGame(endState) {
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
    instantiatePlayer(socketId, username) {
        if (this._playerNameMap.has(username)) return null
        if (this._playerSocketMap.has(socketId)) return null

        const newPlayer = new Player(socketId, username, GameManager.getInstance())

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
    getPlayer(username) {
        return this._playerNameMap.get(username) || null
    }

    /**
    * Gets a Player by socket ID.
    * @param {string} socketId - The socketId of the player.
    * @returns {Player|null} - Returns the Player if it exists and null otherwise.
    */
    getPlayerFromSocketId(socketId) {
        return this._playerSocketMap.get(socketId) || null
    }

    /** Player data cleanup helper function. Sets values to what they "should be" after phase end. */
    phaseEndCleanup() {
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
    getSharedChat(chatId) {
        return this._sharedChats.get(chatId) || null
    }
    
    /**
    * Gets Day Phase Shared Chat.
    * @param {number} [dayNumber] - Which Day Phase chat to retrieve. Defaults to current Day.
    * @returns {SharedChat|null} - Returns the SharedChat if it exists and null otherwise.
    */
    getDayPhaseChat(dayNumber = this.phaseNumber) {
        return this._dayPhaseChats.get(dayNumber) || null
    }

    /**
    * Checks whether the username corresponds to an alive player.
    * @param {string} username - The username of the player.
    * @returns {boolean} - Whether or not the username corresponds to an alive player.
    */
    isAlive(username) {
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
    isAliveMafia(username) {
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
    createSharedChat(displayName, readers = [], writers = []) {
        const newChat = new SharedChat(displayName, GameManager.getInstance(), readers, writers)
        this._sharedChats.set(newChat.chatId, newChat)
        return newChat
    }

    /**
    * Registers a generic Day Phase vote. Checks if conditions are met to Axe a target.
    * @param {string} voterName - The name of the player casting the vote.
    * @param {string|null} targetName - The name of the target. If null, represents a revoked vote.
    */
    registerVote(voterName, targetName) {
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
    axePlayer(targetName) {
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
    registerAttack(attackerName, victimName, attackStrength, specialProperties = []) {
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
    killPlayer(victimName) {
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
    registerVisit(visitorName, targetName) {
        const target = this.getPlayer(targetName)
        target.visitors.add(visitorName)
    }

    /**
    * Registers a whisper between players.
    * @param {string} senderName - The name of the whisperer.
    * @param {string} recipientName - The player being whispered.
    * @param {string} contents - The contents of the whisper.
    */
    registerWhisper(senderName, recipientName, contents) {
        const sender = this.getPlayer(senderName)
        const recipient = this.getPlayer(recipientName)
        console.log(`${senderName} is trying to send ${contents} to ${recipientName}.`)

        if (sender.whispers < 1) return
        sender.whispers = sender.whispers - 1

        recipient.notif(NotificationType.WHISPER, `A whisper from ${senderName}: ${contents}`)
    }

    /**
    * Registers a Designated Attacker vote.
    * @param {string} voterName - The name of the player casting the vote.
    * @param {string|null} targetName - The name of the target. If null, represents a revoked vote.
    */
    registerDAvote(voterName, targetName) {
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
        IOManager.emitToRoom(this.mafiaChat.chatId, 'DA_VOTE_CAST', {newVoteTarget: targetName, previousVoteTarget: oldTarget})

        this.mafiaChat.addMessage(MessageType.VOTE, '[SERVER]', `${voterName} has DA-voted for ${targetName}. They now have ${newTargetData.DAvotesReceived} vote(s).`)
    }
    
    /**
    * Elects and updates the Designated Attacker property. Chooses randomly between tied players.
    * Notifies the Designated Attacker when they are chosen and broadcasts this event to the Mafia.
    */
    electDA() {
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
    get alivePlayers() {return [...this._playerNameMap.keys()].filter(player => (this.getPlayer(player).status === PlayerStatus.ALIVE))}

    /**
    * Returns an array of alive Mafia player usernames.
    * @returns {Array<string>} - An array of alive Mafia player usernames.
    */
    get aliveMafia() {return [...this._playerNameMap.keys()].filter(player => (this.getPlayer(player).status === PlayerStatus.ALIVE && this.getPlayer(player).alignment === PlayerAlignment.MAFIA))}
  
    /**
    * Returns an array of all player usernames.
    * @returns {Array<string>} - An array of player usernames.
    */
    get allPlayers() {return [...this._playerNameMap.keys()]}

    /**
    * Returns the Mafia Shared Chat object.
    * @returns {SharedChat} - Mafia Chat object.
    */
    get mafiaChat() {return this._mafiaChat}

    /**
    * Returns the Lobby Shared Chat object.
    * @returns {SharedChat} - Lobby Chat object.
    */
    get lobbyChat() {return this._lobbyChat}

    /**
    * Sets the Phase Type and broadcasts the change.
    * @param {number} type - The new phase type. Use the PhaseType enum in GameManager.
    */
    set phaseType(type) {
        this._phaseType = type
        IOManager.globalEmit('PHASE_TYPE_UPDATE', {phaseType: type})
    }

    /**
    * Returns the Phase Type.
    * @returns {number} - The Phase Type. Refer to GameManager enum for translation.
    */
    get phaseType() {return this._phaseType}

    /**
    * Sets the Game Status and broadcasts the change.
    * @param {number} status - The new status. Use the GameStatus enum in GameManager.
    */
    set gameStatus(status) {
        this._gameStatus = status
        IOManager.globalEmit('GAME_STATUS_UPDATE', {gameStatus: status})
    }

    /**
    * Returns the Game Status.
    * @returns {number} - The Game Status. Refer to GameManager enum for translation.
    */
    get gameStatus() {return this._gameStatus}

    /**
    * Sets the Phase Number and broadcasts the change.
    * @param {number} number - The Phase number.
    */
    set phaseNumber(number) {
        this._phaseNumber = number
        IOManager.globalEmit('PHASE_NUMBER_UPDATE', {phaseNumber: number})
    }

    /**
    * Returns the Phase Number.
    * @returns {number} - The current phase number.
    */
    get phaseNumber() {return this._phaseNumber}

    /**
    * Sets the Phase Time Left and broadcasts the change.
    * @param {number} time - The time left in the current phase in seconds.
    */
    set phaseTimeLeft(time) {
        this._phaseTimeLeft = time
        IOManager.globalEmit('PHASE_TIME_LEFT_UPDATE', {phaseTimeLeft: time})
    }

    /**
    * Returns the time remaining in the phase, in seconds.
    * @returns {number} - Remaining phase time, in seconds.
    */
    get phaseTimeLeft() {return this._phaseTimeLeft}

    /**
    * Sets the Phase Length.
    * @param {number} length - The new phase length in seconds.
    */
    set phaseLength(length) {
        this._phaseLength = length
    }

    /**
    * Returns the Phase Length.
    * @returns {number} - The phase length, in seconds.
    */
    get phaseLength() {return this._phaseLength}

    /**
    * Returns the username of the Designated Attacker.
    * @returns {string|null} - The name of the Designated Attacker or null if there is no Designated Attacker.
    */
    get designatedAttacker() {return this._designatedAttacker}

    /**
    * Sets the username of the Designated Attacker and notifies the Mafia of the change. Also sends a notifcation to the new DA.
    * @param {string|null} name - The name of the new Designated Attacker. If null, we are "resetting" the DA.
    */
    set designatedAttacker(name) {
        if (name !== null && !this.isAliveMafia(name)) {
            console.error('Designated Attacker cannot be set to a player who is not an alive Mafia member')
            return
        }

        this._designatedAttacker = name
        IOManager.emitToRoom(this.mafiaChat.chatId, 'DA_UPDATE', {DA: name})

        if (name === null) return

        const DA = this.getPlayer(name)
        DA.notif(NotificationType.SERVER, `You have been chosen as the Mafia's Designated Attacker.`)
    }
    
    /**
    * Returns an array of players who died during the previous Night Phase.
    * @returns {Array<string>} - An array of recently deceased player names.
    */
    get diedLastNight() {return Array.from(this._diedLastNight)}
        
    /**
    * Returns the number of alive players.
    * @returns {number} - The number of alive players.
    */
    get alivePlayerCount() {return this.alivePlayers.length}

    /**
    * Returns the number of alive Mafia players.
    * @returns {number} - The number of alive Mafia players.
    */
    get aliveMafiaCount() {return this.aliveMafia.length}

    /**
    * @returns {boolean} - Whether or not there is an admin in the lobby.
    */
    get hasAdmin() {return this._hasAdmin}

    /** Promotes a player to admin. 
    * @param {Player} player - The player to promote.
    */
    promote(player) {
        player.admin = true
        this._hasAdmin = true
    }

}

module.exports = { GameManager }
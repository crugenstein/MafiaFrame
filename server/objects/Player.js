const { roleDictionary } = require('../data/roles')
const { GameManager } = require('../utils/GameManager')
const { PhaseAbility } = require('./PhaseAbility')
const { IOManager } = require('../io/IOManager')

const PlayerStatus = Object.freeze({
    SPECTATOR: 0,
    ALIVE: 1,
    DEAD: 2
})

const PlayerAlignment = Object.freeze({
    TOWN: 0,
    MAFIA: 1,
    NEUTRAL: 2
})

const NotificationType = Object.freeze({
    ABILITY_RESULT: 0,
    WHISPER: 1,
    SERVER: 2
})

class Player {
    constructor(socketId, username) {
        this._socketId = socketId
        this._username = username
        this._admin = false
        
        this._status = PlayerStatus.SPECTATOR

        this._roleData = null // this is an object that should never be directly returned or modified outside of the assign role
        
        /** @type {Map<string, PhaseAbility>} */
        this._activeAbilities = new Map()

        /** @type {number} */
        this._baseDefense = 0

        /** @type {number} */
        this._defense = 0

        /** @type {number} */
        this._whispers = 3

        /** @type {number} */
        this._abilitySlots = 1

        /**
        * Set of player names who visited this player during Ability Queue. Do not access outside of ability queue.
        * @type {Set<string>}
        */
        this._visitors = new Set()

        /**
        * Keys are strings of form PhaseType-PhaseNumber. Values are arrays of Notification objects.
        * @type {Map<string, Array<{notificationType: number, notificationText: string}>}
        */
        this._notifications = new Map()
        
        /**
        * A set of chat IDs that this player can read messages from.
        * @type {Set<string>}
        */
        this._readableChats = new Set()

        /**
        * A set of chat IDs that this player can write messages to.
        * @type {Set<string>}
        */
        this._writeableChats = new Set()
    }

    /**
    * Assigns a Role to the player, updating their RoleData information and ability usages.
    * @param {string} roleKey - The unique Key of the role to assign to this player.
    */
    assignRole(roleKey) { // todo make it snappier
        const roleData = roleDictionary[roleKey]
        this._roleData = roleData

        roleData.abilities.forEach( ({abilityKey, abilityCount} ) => {
            const newAbility = new PhaseAbility(this.username, abilityKey, abilityCount)
            this._activeAbilities.set(newAbility.id, newAbility)
        })

        this._baseDefense = roleData.defense
        this._defense = this._baseDefense
    }

    /**
    * Notifies the player, emits a notification receive event to the client.
    * @param {number} notificationType - The type of notification. Refer to NotificationType enum.
    * @param {string} notificationText - The notification text.
    */
    notif(notificationType, notificationText) {
        const key = `${GameManager.phaseType}-${GameManager.phaseNumber}`

        const oldNotifs = this._notifications.get(key) || []
        const newNotifs = [...oldNotifs, {notificationType, notificationText}]

        this._notifications.set(key, newNotifs)
        IOManager.emitToPlayer(this.username, 'RECEIVE_NOTIF', {notificationTime: key, notificationType, notificationText})
    }

    /** @returns {string} The player's username. */
    get username() {return this._username}

    /** @returns {boolean} Whether or not this player has admin privileges. */
    get admin() {return this._admin}

    /**
    * Updates a player's status. If they are not alive, removes their ability to send messages to Shared Chats.
    * @param {number} newStatus - The player's new status. Use PlayerStatus enum for translation.
    */
    set status(newStatus) {
        if (newStatus !== PlayerStatus.ALIVE) {
            this._chatsCanWrite.forEach((chat) => {
                chat.revokeWrite(this.username)
            })
        }

        this._status = newStatus
        IOManager.emitToPlayer(this.username, 'RECEIVE_STATUS', {status: newStatus})
    }

    /** @returns {number} The player's status. Refer to PlayerStatus enum in GameManager. */
    get status() {return this._status}

    /** @returns {string} The name of this player's role.*/
    get roleName() {return this._roleData.name}

    /** @returns {number} The player's alignment. Refer to PlayerAlignment enum.*/
    get alignment() {return this._roleData.alignment}

    /**
    * Sets the player's number of whispers and emits the change as an event to client.
    * @param {number} count - The number of whispers.
    */
    set whispers(count) {
        this._whispers = count
        IOManager.emitToPlayer(this.username, 'WHISPER_COUNT_UPDATE', {whisperCount: count})
    }

    /** @returns {number} How many whispers the player has left. */
    get whispers() {return this._whispers}

    /**
    * Sets the player's number of ability usage slots and emits the change as an event to client.
    * @param {number} count - The number of ability usage slots.
    */
    set abilitySlots(count) {
        this._abilitySlots = count
        IOManager.emitToPlayer(this.username, 'ABILITY_SLOT_COUNT_UPDATE', {abilitySlotCount: count})
    }

    /** @returns {number} How many ability slots the player has left. */
    get abilitySlots() {return this._abilitySlots}

    /**
    * Sets the player's defense to the maximum of their current defense and the granted level.
    * Use this during phase ability queues.
    * @param {number} level - The defense level to grant.
    */
    grantDefense(level) {
        this._defense = Math.max(this.defense, level)
    }

    /** Resets the player's defense level. Should be called on phase cleanup. */
    resetDefense() {
        this._defense = this._baseDefense
    }

    /** @returns {number} The player's current defense level.*/
    get defense() {return this._defense}

    /** @returns {string} The player's socketId.*/
    get socketId() {return this._socketId}

    /** @returns {Set<string>} Set of chatIDs that this player can read from. */
    get readableChats() {return this._readableChats}

    /** @returns {Set<string>} Set of chatIDs that this player can send to. */
    get writeableChats() {return this._writeableChats}

    /** @returns {Map<string, PhaseAbility>} Map of Active Abilities owned by this player. */
    get activeAbilities() {return this._activeAbilities}

    /**
    * Gets a PhaseAbility instance that the player owns from its UUID.
    * @param {string} abilityUUID - The UUID of the ability to fetch. 
    * @returns {PhaseAbility|null} Returns the associated PhaseAbility object if the player has it. Otherwise returns null. 
    */
    getAbility(abilityUUID) {
        return this._activeAbilities.get(abilityUUID) || null
    }

    /** @returns {Array<string>} Array of active ability IDs corresponding to abilities that this player owns. */
    get activeAbilityIdList() {return [...this._activeAbilities.keys()]}

    /** @returns {{username: string, admin: boolean}} Object containing public-facing player data. */
    get publicData() {
        return ({
            username: this.username,
            admin: this.admin
        })
    }

    clientGameStateUpdate() {
        
    }
}

module.exports = { Player, PlayerStatus, PlayerAlignment, NotificationType }
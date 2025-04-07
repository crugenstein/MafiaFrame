const { PlayerStatus, PlayerAlignment } = require('../data/enums')
const { roleDictionary } = require('../data/roles')
const { PhaseAbility } = require('./PhaseAbility')
const { IOManager } = require('../io/IOManager')

/** @typedef {import('../utils/GameManager').GameManager} GameManager */

class Player {
    constructor(socketId, username, gameInstance) {

        this._gameInstance = gameInstance
        this._socketId = socketId
        this._username = username
        this._admin = false
        
        this._status = PlayerStatus.SPECTATOR

        this._roleData = null // this is an object that should never be directly returned or modified outside of the assign role
        
        /** @type {Map<string, PhaseAbility>} */
        this._activeAbilities = new Map()

        /** @type {number} The level of defense intrinsic to the assigned role. */
        this._baseDefense = 0

        /** @type {number} The modified level of defense */
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
            const newAbility = new PhaseAbility(this.username, abilityKey, abilityCount, this.gameInstance)
            this._activeAbilities.set(newAbility.abilityId, newAbility)
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
        const key = `${this.gameInstance.phaseType}-${this.gameInstance.phaseNumber}`

        const oldNotifs = this._notifications.get(key) || []
        const newNotifs = [...oldNotifs, {notificationType, notificationText}]

        this._notifications.set(key, newNotifs)
        IOManager.emitToPlayer(this, 'RECEIVE_NOTIF', {notificationTime: key, notificationType, notificationText})
    }

    /** @returns {GameManager} A reference to the GameManager instance. */
    get gameInstance() {return this._gameInstance}

    /** @returns {string} The player's username. */
    get username() {return this._username}

    /**
    * Sets whether or not a player is admin.
    * @param {boolean} val - Whether to make this player an admin or not.
    */
    set admin(val) {this._admin = val}

    /** @returns {boolean} Whether or not this player has admin privileges. */
    get admin() {return this._admin}

    /**
    * Updates a player's status. If they are not alive, removes their ability to send messages to Shared Chats.
    * @param {number} newStatus - The player's new status. Use PlayerStatus enum for translation.
    */
    set status(newStatus) {
        if (newStatus !== PlayerStatus.ALIVE) {
            this._writeableChats.forEach((chat) => {
                this._gameInstance.getSharedChat(chat).revokeWrite(this._username)
            })
        }

        this._status = newStatus
        IOManager.emitToPlayer(this, 'RECEIVE_STATUS', {status: newStatus})
    }

    /** @returns {number} The player's status. Refer to PlayerStatus enum in GameManager. */
    get status() {return this._status}

    /** @returns {string} The name of this player's role.*/
    get roleName() {return this._roleData.name}

    /** @returns {number|null} The player's alignment (if they have one). Refer to PlayerAlignment enum.*/
    get alignment() {
        if (this._roleData) return this._roleData.alignment
        else return null
    }

    /**
    * Sets the player's number of whispers and emits the change as an event to client.
    * @param {number} count - The number of whispers.
    */
    set whispers(count) {
        this._whispers = count
        IOManager.emitToPlayer(this, 'WHISPER_COUNT_UPDATE', {whisperCount: count})
    }

    /** @returns {number} How many whispers the player has left. */
    get whispers() {return this._whispers}

    /** @returns {Set<string>} A list of visitors. */
    get visitors() {return this._visitors}

    /**
    * Sets the player's number of ability usage slots and emits the change as an event to client.
    * @param {number} count - The number of ability usage slots.
    */
    set abilitySlots(count) {
        this._abilitySlots = count
        IOManager.emitToPlayer(this, 'ABILITY_SLOT_COUNT_UPDATE', {abilitySlotCount: count})
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

    /**
    * Registers a visit to another player.
    * @param {string} target - The username of the player to visit.
    */
    visit(target) {
        this.gameInstance.registerVisit(this.username, target)
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

    /** Emits an event to the client containing data that should be visible. */
    clientGameStateUpdate() {
        let abilityData = []
        let chatData = []

        const playerData = this.gameInstance.allPlayers.map((username) => {
            const target = this.gameInstance.getPlayer(username)

            let visibleAlignment = 'UNKNOWN'
            let visibleRole = 'UNKNOWN'

            if (target.status == PlayerStatus.DEAD || (this.alignment === PlayerAlignment.MAFIA && target.alignment == PlayerAlignment.MAFIA)) {
                visibleRole = target.roleName
                visibleAlignment = target.alignment
            }
    
            return ({
                username, 
                visibleAlignment,
                visibleRole,
                admin: target.admin, 
                status: target.status
            })

        })
        
        this.activeAbilityIdList.forEach((id) => {
            const ability = this.getAbility(id)
            abilityData.push(ability.getVisibleData())
        })

        this.readableChats.forEach((id) => {
            const chat = this.gameInstance.getSharedChat(id)
            chatData.push(chat.getVisibleData())
        })

        const data = {abilityData, chatData, playerData, roleName: this.roleName, alignment: this.alignment}

        IOManager.emitToPlayer(this, 'CLIENT_GAME_STATE_UPDATE', data)
    }
}

module.exports = { Player }
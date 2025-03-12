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
        this.socketId = socketId
        this.username = username
        
        this._status = PlayerStatus.SPECTATOR
        this.admin = false

        this.role = null
        this.activeAbilities = new Map() // KEY: uuid, VALUE: PhaseAbility object
        this.baseDefense = 0
        this.defense = 0
        this.whispers = 3

        this.abilitySlots = 1

        this.visitors = new Set()

        this.notifications = new Map()
        
        this._chatsCanWrite = new Set() // object {chatId}
        this._chatsCanRead = new Set() // object {chatId}
    }

    assignRole(roleKey) {
        const roleData = roleDictionary[roleKey]
        this.role = roleData

        roleData.abilities.forEach( ({abilityKey, abilityCount} ) => {
            const newAbility = new PhaseAbility(this.username, abilityKey, abilityCount)
            this.activeAbilities.set(newAbility.id, newAbility)
        })

        this.baseDefense = roleData.defense
        this.defense = this.baseDefense
    }

    addVisitor(visitor) {
        this.visitors.add(visitor)
    }
    
    clearVisitors() {
        this.visitors.clear()
    }

    notif(notificationText) {
        const key = `${GameManager.getPhaseType()}-${GameManager.getPhaseNumber()}`
        const oldNotifs = this.notifications.get(key) || []
        const newNotifs = [...oldNotifs, notificationText]
        this.notifications.set(key, newNotifs)
        IOManager.emitToPlayer(this.username, 'RECEIVE_NOTIF', {time: key, text: notificationText})
    }

    /**
    * Updates a player's status. If they are not alive, removes their ability to send messages to Shared Chats.
    * 
    * @param {number} newStatus - The player's new status. Use PlayerStatus enum for translation.
    */
    set status(newStatus) {
        if (newStatus !== PlayerStatus.ALIVE) {
            this._chatsCanWrite.forEach((chat) => {
                chat.revokeWrite(this.username)
            })
        }
        this._status = newStatus
    }

    setStatus(newStatus) {
        this.status = newStatus
    }

    getRoleName() {
        return this.role.name
    }

    getUsername() {
        return this.username
    }

    setDefense(level) {
        this.defense = Math.max(this.defense, level)
    }

    resetDefense() {
        this.defense = this.baseDefense
    }

    getDefense() {
        return this.defense
    }

    setWhispers(whisperCount) {
        this.whispers = whisperCount
    }
    
    getWhisperCount() {
        return this.whispers
    }

    getSocketId() {
        return this.socketId
    }

    getStatus() {
        return this.status
    }

    getAbility(abilityUUID) {
        return this.activeAbilities.get(abilityUUID) || null
    }

    getAlignment() {
        return this.roleData.alignment
    }

    getNotifications() {
        return this.notifications
    }

    getReadableChatData() {
        return Array.from(this.chatsCanRead)
    }

    getWriteableChatData() {
        return Array.from(this.chatsCanWrite)
    }

    addReadableChat(name, chatId) {
        this.chatsCanRead.add({name, chatId})
    }

    addWriteableChat(name, chatId) {
        this.chatsCanWrite.add({name, chatId})
    }

    removeReadableChat(chatId) {
        const toDelete = [...this.chatsCanRead].find(chat => chat.chatId === chatId)
        if (toDelete) this.chatsCanRead.delete(toDelete)
    }

    removeWriteableChat(chatId) {
        const toDelete = [...this.chatsCanWrite].find(chat => chat.chatId === chatId)
        if (toDelete) this.chatsCanWrite.delete(toDelete)
    }

    getAllAbilityData() {
        return [...this.activeAbilities.values()].map(ability => ability.getVisibleProperties())
    }

    setAbilitySlots(actionsLeft) {
        this.abilitySlots = actionsLeft
    }

    getAbilitySlots() {
        return this.abilitySlots
    }

    get publicData() {
        //todo
    }
}

module.exports = { Player, PlayerStatus, PlayerAlignment, NotificationType }
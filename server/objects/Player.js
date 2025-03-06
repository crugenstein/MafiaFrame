const { roleDictionary } = require('../data/roles')
const { GameManager } = require('../utils/GameManager')
const { PhaseAbility } = require('./PhaseAbility')

class Player {
    constructor(socketId, username) {
        this.socketId = socketId
        this.username = username
        
        this.status = 'SPEC'  // 'ALIVE', 'DEAD', or 'SPEC'
        this.admin = false

        this.role = null
        this.activeAbilities = new Map() // KEY: uuid, VALUE: PhaseAbility object
        this.baseDefense = 0
        this.defense = 0
        this.whispers = 3

        this.visitors = new Set()

        this.notifications = new Map()
    }

    assignRole(roleKey) {
        const roleData = roleDictionary[roleKey]
        this.role = roleData

        roleData.abilities.forEach( ({abilityKey, abilityCount} ) => {
            const newAbility = new PhaseAbility(abilityKey, abilityCount)
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
        const key = `${GameManager.phaseType}-${GameManager.phaseNumber}`
        const oldNotifs = this.notifications.get(key) || []
        const newNotifs = [...oldNotifs, notificationText]
        this.notifications.set(key, newNotifs)
        //notif io prolly
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

    spendAbilityUsage(abilityUUID) {
        const abilityData = this.activeAbilities.get(abilityUUID)
        abilityData.usesLeft--
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

}

module.exports = { Player }
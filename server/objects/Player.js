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
        this.activeAbilities = [] // {ability: ActiveAbility, usesLeft: INT}

        this.visitors = new Set()

        this.notifications = new Map()
    }

    assignRole(roleKey) {
        const roleData = roleDictionary[roleKey]
        this.role = roleData

        this.activeAbilities = roleData.abilities.map( ({abilityKey, abilityCount} ) => {
            return {
                ability: new PhaseAbility(abilityKey),
                usesLeft: abilityCount
            }
        })
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
    }

    setStatus(newStatus) {
        this.status = newStatus
    }
}

module.exports = { Player }
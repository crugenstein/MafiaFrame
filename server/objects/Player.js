const { roleDictionary } = require('../data/roles')
const { PhaseAbility } = require('./PhaseAbility')

class Player {
    constructor(socketId) {
        this.socketId = socketId
        
        this.status = 'SPEC'  // 'ALIVE', 'DEAD', or 'SPEC'
        this.admin = false

        this.role = null
        this.activeAbilities = [] // {ability: ActiveAbility, usesLeft: INT}
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
}

module.exports = { Player }
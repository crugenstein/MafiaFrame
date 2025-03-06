const abilities = require('../data/abilities')
const { v4: uuidv4 } = require('uuid')

class PhaseAbility {
    constructor(abilityKey, addedTags = []) { // look up the ability data from abilities.js, then add some tags if necessary
        const abilityData = abilities.abilityDictionary[abilityKey]
        this.id = uuidv4()

        this.abilityKey = abilityKey
        this.name = abilityData.name
        this.description = abilityData.description
        this.effect = abilityData.effect
        this.selectionBoxes = abilityData.selectionBoxes
        this.tags = new Set([...abilityData.tags, addedTags])
    }
}

module.exports = { PhaseAbility }
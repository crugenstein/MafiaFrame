const abilities = require('../data/abilities')
const { v4: uuidv4 } = require('uuid')
const { GameManager } = require('../utils/GameManager')
const { IOManager } = require('../io/IOManager')

class PhaseAbility {
    constructor(ownerName, abilityKey, abilityCount, addedTags = []) { // look up the ability data from abilities.js, then add some tags if necessary
        const abilityData = abilities.abilityDictionary[abilityKey]
        this.ownerName = ownerName
        this.id = uuidv4()
        this.usesLeft = abilityCount

        this.abilityKey = abilityKey
        this.name = abilityData.name
        this.description = abilityData.description
        this.effect = abilityData.effect
        this.selections = abilityData.selections
        this.tags = new Set([...abilityData.tags, addedTags])
        this.priority = abilityData.priority
    }

    getAbilityKey() {
        return this.abilityKey
    }

    getName() {
        return this.name
    }

    getPriority() {
        return this.priority
    }

    getOwner() {
        return GameManager.getPlayer(this.ownerName)
    }

    getOwnerName() {
        return this.ownerName
    }

    getSelections() {
        return this.selections
    }

    getEffect() {
        return this.effect
    }

    getUsesLeft() {
        return this.usesLeft
    }

    hasTag(tag) {
        return this.tags.has(tag)
    }

    spendUsage() {
        this.usesLeft--
        IOManager.emitToPlayer(this.ownerName, 'ABILITY_CHANGE', {})
    }
}

module.exports = { PhaseAbility }
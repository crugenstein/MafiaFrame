const { abilityDictionary } = require('../data/abilities')
const { v4: uuidv4 } = require('uuid')
const { IOManager } = require('../io/IOManager')
const { AbilityManager } = require('../utils/AbilityManager')

/** @typedef {import('../utils/GameManager').GameManager} GameManager */

class PhaseAbility {
    /** Creates an instance of a PhaseAbility.
    * @param {string} owner - The name of the player who owns this.
    * @param {string} key - The ability's lookup tag.
    * @param {number} usages - The number of times this can be used.
    * @param {GameManager} gameInstance - The gameInstance.
    * @param {Array<number>} [addedTags] - Tags to add upon creation.
    * @param {Array<number>} [addedHiddenTags] - Hidden tags to add upon creation.
    */
    constructor(owner, key, usages, gameInstance, addedTags = [], addedHiddenTags = []) {
        this._owner = owner
        this._abilityId = uuidv4()
        this._usages = usages
        this._gameInstance = gameInstance

        const abilityData = abilityDictionary[key]

        this._abilityKey = abilityKey
        this._name = abilityData.name
        this._description = abilityData.description
        this._effect = abilityData.effect
        this._selections = abilityData.selections
        this._tags = new Set([...abilityData.tags, ...addedTags])
        this._hiddenTags = addedHiddenTags
        this._priority = abilityData.priority
    }

    /** @returns {string} The UUID of this PhaseAbility. */
    get abilityId() {return this._abilityId}

    /** @returns {string} The 'ability key' of this PhaseAbility. */
    get key() {return this._abilityKey}

    /** @returns {string} The PhaseAbility's name. */
    get name() {return this._name}

    /** @returns {string} The PhaseAbility's description. */
    get description() {return this._description}

    /** @returns {number} The PhaseAbility's priority. */
    get priority() {return this._priority}

    /** @returns {string} The name of this PhaseAbility's owner. */
    get owner() {return this._owner}

    /** @returns {Array<string>} An ordered sequence of target selection prompts for this to expect. */
    get selections() {return this._selections}

    /** @returns {Function} What the ability does when activated. */
    get effect() {return this._effect}

    /** @returns {number} The number of usages this ability has left. */
    get usages() {return this._usages}

    set usages(count) {
        this._usages = count
        IOManager.emitToPlayer(this._gameInstance.getPlayer(this.owner), 'ABILITY_USAGE_UPDATE', {abilityId: this._abilityId, newCount: count})
    }

    /** @returns {Set<number>} All tags (refer to AbilityTag enum) that this ability has.*/
    get tags() {return this._tags}

    /** Checks whether or not the ability has a specific tag.
    * @param {number} tag - The tag to check for.
    * @returns {boolean} Whether or not the ability has the selected tag. 
    */
    hasTag(tag) {return this.tags.has(tag)}

    /** Uses the ability.
    * @param {Array} targetData - The target data. This should be replaced by an object in the future.
    */
    use(targetData) {
        const ownerPlayer = this._gameInstance.getPlayer(this.owner)
        ownerPlayer.abilitySlots = ownerPlayer.abilitySlots - 1
        this.usages = this.usages - 1
        AbilityManager.queueAbility(this.ownerPlayer, this, targetData)
    }

    /** Fetches the Ability data that should be visible to its owner clientside.
    * @returns {{id: string, name: string, description: string, usages: number, selections: Array<string>, tags: Array<number>}} The ability's visible data.
    */
    getVisibleData() {
        return ({
            id: this.abilityId,
            name: this.name,
            description: this.description,
            usages: this.usages,
            selections: this.selections,
            tags: [...this.tags]
        })
    }
}

module.exports = { PhaseAbility }
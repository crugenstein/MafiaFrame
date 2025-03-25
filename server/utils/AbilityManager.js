const { AbilityTag } = require('../data/enums')

/** @typedef {import('../objects/Player').Player} Player */
/** @typedef {import('../objects/PhaseAbility').PhaseAbility} PhaseAbility */

class AbilityManager {
    /** @type {Array<{user: Player, ability: PhaseAbility, targetData: Array}>} */
    static _queue = []

    /** Queues an ability to be activated at the end of the phase.
    * @param {Player} user - The ability user.
    * @param {PhaseAbility} ability - The ability being used.
    * @param {Array} targetData - The target data. This should probably be an object later on. 
    */
    static queueAbility(user, ability, targetData) {this._queue.push({user, ability, targetData})}
    
    /** Activates all of the queued abilities in priority order, then resets the queue. */
    static processPhaseEnd() {
        this._queue.sort((a, b) => { // sort by priority
           a.ability.priority - b.ability.priority
        })

        this._queue.forEach( ( {user, ability, targetData} ) => { // do visits

            if (JSON.stringify(ability.selections) === JSON.stringify(["SELECT_SINGLE_PLAYER_TARGET"]) && !ability.hasTag(AbilityTag.ASTRAL)) {
                user.visit(targetData[0])
            }
        })

        this._queue.forEach( ( {user, ability, targetData} ) => { // do effects

            if (JSON.stringify(ability.selections) === JSON.stringify(["SELECT_SINGLE_PLAYER_TARGET"])) {
                ability.effect({user: user.username, target: targetData[0], instance: user.gameInstance})
            }
        })
        this._queue = []
    }
}

module.exports = {AbilityManager}
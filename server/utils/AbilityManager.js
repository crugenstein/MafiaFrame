const { GameManager } = require("./GameManager")
const { AbilityTag } = require('../data/abilities')

class AbilityManager {
    /** @type {Array<{user: string, id: string, targetData: Array}>} */
    static _queue = []

    /** Queues an ability to be activated at the end of the phase.
    * @param {string} user - The ability user's name.
    * @param {string} id - The UUID of the ability being used.
    * @param {Array} targetData - The target data. This should probably be an object later on. 
    */
    static queueAbility(user, id, targetData) {this._queue.push({user, id, targetData})}
    
    /** Activates all of the queued abilities in priority order, then resets the queue. */
    static processPhaseEnd() {
        this._queue.sort((a, b) => { // sort by priority
            GameManager.getPlayer(a.userName).getAbility(a.abilityUUID).priority - 
            GameManager.getPlayer(b.userName).getAbility(b.abilityUUID).priority
        })

        this._queue.forEach( ( {user, id, targetData} ) => { // do visits
            const ability = GameManager.getPlayer(user).getAbility(id)

            if (JSON.stringify(ability.selections) === JSON.stringify(["SELECT_SINGLE_PLAYER_TARGET"]) && !ability.hasTag(AbilityTag.ASTRAL)) {
                GameManager.registerVisit(user, targetData[0])
            }
        })

        this._queue.forEach( ( {user, id, targetData} ) => { // do effects
            const ability = GameManager.getPlayer(user).getAbility(id)

            if (JSON.stringify(ability.selections) === JSON.stringify(["SELECT_SINGLE_PLAYER_TARGET"])) {
                ability.effect({user, target: targetData[0]})
            }
        })
        this._queue = []
    }
}

module.exports = {AbilityManager}
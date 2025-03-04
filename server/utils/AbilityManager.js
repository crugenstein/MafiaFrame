const { GameManager } = require("./GameManager")

class AbilityManager {
    static queue = []

    static queueAbility(user, ability, targetData) {
        this.queue.push({user, ability, targetData})
    }
    
    static processPhaseEnd() {
        this.queue.sort((a, b) => a.ability.priority - b.ability.priority)
        this.queue.forEach( ({user, ability, targetData}) => {
            if (user) {
                if (ability.selections == ["SELECT_SINGLE_PLAYER_TARGET"]) {
                    GameManager.registerVisit(user, targetData[0])
                }
            }
        })
        this.queue.forEach( ({user, ability, targetData}) => {
            if (ability.selections == ["SELECT_SINGLE_PLAYER_TARGET"]) {
                ability.effect({user, target: targetData[0]})
            }
        })
        this.queue = []
        GameManager.clearVisits()
    }
}

module.exports = {AbilityManager}
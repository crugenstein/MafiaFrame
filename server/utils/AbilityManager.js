const { GameManager } = require("./GameManager")

class AbilityManager {
    static queue = []

    static queueAbility(userName, abilityUUID, targetData) {
        this.queue.push({userName, abilityUUID, targetData})
    }
    
    static processPhaseEnd() {
        this.queue.sort((a, b) => {
            GameManager.getPlayer(a.userName).getAbility(a.abilityUUID).getPriority() - 
            GameManager.getPlayer(b.userName).getAbility(b.abilityUUID).getPriority()
        })
        this.queue.forEach( ({userName, abilityUUID, targetData} ) => {
            const ability = GameManager.getPlayer(userName).getAbility(abilityUUID)

            if (JSON.stringify(ability.getSelections()) === JSON.stringify(["SELECT_SINGLE_PLAYER_TARGET"]) && !ability.hasTag("ASTRAL")) {
                GameManager.registerVisit(userName, targetData[0])
            }
        })
        this.queue.forEach( ({userName, abilityUUID, targetData} ) => {
            const ability = GameManager.getPlayer(userName).getAbility(abilityUUID)
            if (JSON.stringify(ability.getSelections()) === JSON.stringify(["SELECT_SINGLE_PLAYER_TARGET"])) {
                ability.getEffect()({userName, targetName: targetData[0]})
            }
        })
        this.queue = []
    }
}

module.exports = {AbilityManager}
class AbilityManager {
    static queue = []

    static queueAbility(user, ability, targetData) {
        this.queue.push({user, ability, targetData})
    }
    
    static processPhaseEnd() {
        this.queue.sort((a, b) => a.ability.priority - b.ability.priority);
    }
}

module.exports = {AbilityManager}
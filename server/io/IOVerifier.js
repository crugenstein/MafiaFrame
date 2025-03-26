const { GameStatus, PhaseType, AbilityTag } = require('../data/enums')

class IOVerifier {

    static verifyJoinGame(socketId, username, instance) {
        if (instance.gameStatus !== GameStatus.LOBBY_WAITING ||
            instance.getPlayerFromSocketId(socketId) || 
            instance.getPlayer(username)) return false
        return true
    }

    static verifyChatMessage(socketId, message, chatId, instance) {
        const attemptedChat = instance.getSharedChat(chatId)
        const senderName = instance.getPlayerFromSocketId(socketId).username
        if (!attemptedChat ||
            !attemptedChat.canWrite(senderName) ||
            instance.gameStatus === GameStatus.ROLLOVER) return false
        return true
    }
    
    static verifySubmitAbility(socketId, abilityId, targetData, instance) {
        const user = instance.getPlayerFromSocketId(socketId)
        const ability = user.getAbility(abilityId)
        if (!ability ||
            ability.usages < 1 ||
            user.abilitySlots < 1 ||
            !instance.isAlive(user.username) ||
            instance.gameStatus === GameStatus.ROLLOVER ||
            (ability.hasTag(AbilityTag.DAY) && instance.phaseType !== PhaseType.DAY) ||
            (ability.hasTag(AbilityTag.NIGHT) && instance.phaseType !== PhaseType.NIGHT) ||
            (ability.hasTag(AbilityTag.DESIGNATED) && instance.designatedAttacker !== user.username)
        ) return false

        //BELOW THIS IS JANK AND WILL BE MADE CLEANER LATER
        if (JSON.stringify(ability.selections) === JSON.stringify(["SELECT_SINGLE_PLAYER_TARGET"])) {
            if (!(Array.isArray(targetData) && targetData.length === 1)) return false
            const attemptedTarget = targetData[0]
            if (!instance.isAlive(attemptedTarget)) return false
        } // other logic for other selection list types
        return true
    }

    static verifySendWhisper(socketId, contents, recipient, instance) {
        const sender = instance.getPlayerFromSocketId(socketId)
        if (instance.phaseType !== PhaseType.DAY ||
            instance.gameStatus === GameStatus.ROLLOVER ||
            !instance.isAlive(recipient) ||
            !instance.isAlive(sender.username) ||
            sender.whispers < 1) return false
        return true
    }

    static verifyVote(socketId, target, instance) {
        const voter = instance.getPlayerFromSocketId(socketId)
        if (instance.phaseType !== PhaseType.DAY ||
            instance.gameStatus === GameStatus.ROLLOVER ||
            !instance.isAlive(target) ||
            !instance.isAlive(voter.username)) return false
        return true
    }

    static verifyDAvote(socketId, target, instance) {
        const voter = instance.getPlayerFromSocketId(socketId)
        if (instance.phaseType !== PhaseType.DAY ||
            instance.gameStatus === GameStatus.ROLLOVER ||
            !instance.isAliveMafia(target) ||
            !instance.isAliveMafia(voter.username)) return false
        return true
    }
}

module.exports = { IOVerifier }
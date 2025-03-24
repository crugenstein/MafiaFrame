const { GameStatus, PhaseType, AbilityTag } = require('../data/enums')
const { GameManager } = require('../utils/GameManager')

class IOVerifier {

    static verifyJoinGame(socketId, username) {
        if (GameManager.gameStatus !== GameStatus.LOBBY_WAITING ||
            GameManager.getPlayerFromSocketId(socketId) || 
            GameManager.getPlayer(username)) return false
        return true
    }

    static verifyChatMessage(socketId, message, chatId) {
        const attemptedChat = GameManager.getSharedChat(chatId)
        const senderName = GameManager.getPlayerFromSocketId(socketId).username
        if (!attemptedChat ||
            !attemptedChat.canWrite(senderName) ||
            GameManager.gameStatus === GameStatus.ROLLOVER) return false
        return true
    }
    
    static verifySubmitAbility(socketId, abilityId, targetData) {
        const user = GameManager.getPlayerFromSocketId(socketId)
        const ability = user.getAbility(abilityId)
        if (!ability ||
            ability.usages < 1 ||
            user.abilitySlots < 1 ||
            !GameManager.isAlive(user.username) ||
            GameManager.gameStatus === GameStatus.ROLLOVER ||
            (ability.hasTag(AbilityTag.DAY) && GameManager.phaseType !== PhaseType.DAY) ||
            (ability.hasTag(AbilityTag.NIGHT) && GameManager.phaseType !== PhaseType.NIGHT) ||
            (ability.hasTag(AbilityTag.DESIGNATED) && GameManager.designatedAttacker !== user.username)
        ) return false

        //BELOW THIS IS JANK AND WILL BE MADE CLEANER LATER
        if (JSON.stringify(ability.selections) === JSON.stringify(["SELECT_SINGLE_PLAYER_TARGET"])) {
            if (!(Array.isArray(targetData) && targetData.length === 1)) return false
            const attemptedTarget = targetData[0]
            if (!GameManager.isAlive(attemptedTarget)) return false
        } // other logic for other selection list types
        return true
    }

    static verifySendWhisper(socketId, contents, recipient) {
        const sender = GameManager.getPlayerFromSocketId(socketId)
        if (GameManager.phaseType !== PhaseType.DAY ||
            GameManager.gameStatus === GameStatus.ROLLOVER ||
            !GameManager.isAlive(recipient) ||
            !GameManager.isAlive(sender.username) ||
            sender.whispers < 1) return false
        return true
    }

    static verifyVote(socketId, target) {
        const voter = GameManager.getPlayerFromSocketId(socketId)
        if (GameManager.phaseType !== PhaseType.DAY ||
            GameManager.gameStatus === GameStatus.ROLLOVER ||
            !GameManager.isAlive(target) ||
            !GameManager.isAlive(voter.username)) return false
        return true
    }

    static verifyDAvote(socketId, target) {
        const voter = GameManager.getPlayerFromSocketId(socketId)
        if (GameManager.phaseType !== PhaseType.DAY ||
            GameManager.gameStatus === GameStatus.ROLLOVER ||
            !GameManager.isAliveMafia(target) ||
            !GameManager.isAliveMafia(voter.username)) return false
        return true
    }

    static verifyChatRead(socketId, chatId) { // ??????
        const player = GameManager.getPlayerFromSocketId(socketId)
        const chat = GameManager.getSharedChat(chatId)
        if (!chat.canRead(chatId)) return false
        return true
    }
}

module.exports = { IOVerifier }
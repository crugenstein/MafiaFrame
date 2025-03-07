const { GameManager } = require('../utils/GameManager')

class IOVerifier {

    static verifyJoinGame(socketId, username) {
        if (GameManager.players.has(username)) return false
        return true
    }

    static verifyChatMessage(socketId, message, chatId) {
        const attemptedChat = GameManager.getSharedChat(chatId)
        if (!attemptedChat) return false
        const senderName = GameManager.getPlayerFromSocketId(socketId).getUsername()
        if (!attemptedChat.canWrite(senderName)) return false
        //probably check message length and some other stuff
        return true
    }
    
    static verifySubmitAbility(socketId, abilityUUID, targetData) {
        const user = GameManager.getPlayerFromSocketId(socketId)
        if (!user) return false
        if (GameManager.isAlive(user.getUsername())) return false
        const ability = user.getAbility(abilityUUID)
        if (!ability) return false
        if (!ability.getUsesLeft() < 1) return false
        const phase = GameManager.getPhaseType()
        if (ability.hasTag('DAY') && phase !== 'DAY') return false
        else if (ability.hasTag('NIGHT') && phase !== 'NIGHT') return false
        const selectionList = ability.getSelections()

        if (JSON.stringify(selectionList) === JSON.stringify(["SELECT_SINGLE_PLAYER_TARGET"])) {
            if (!(Array.isArray(targetData) && targetData.length === 1)) return false
            const attemptedTarget = targetData[0]
            if (!GameManager.isAlive(attemptedTarget)) return false
        }
        // other logic for other selection list types
        return true
    }

    static verifySendWhisper(socketId, recipientUsername, contents) {
        const phase = GameManager.getPhaseType()
        if (phase !== 'DAY') return false
        const sender = GameManager.getPlayerFromSocketId(socketId)
        if (!sender) return false
        if (!GameManager.isAlive(sender.getUsername())) return false
        if (sender.getWhisperCount() < 1) return false
        if (!GameManager.isAlive(recipientUsername)) return false
        // probably should check the contents
        return true
    }

    static verifyVote(socketId, voteTargetUsername) {
        const phase = GameManager.getPhaseType()
        if (phase !== 'DAY') return false
        const sender = GameManager.getPlayerFromSocketId(socketId)
        if (!sender) return false
        if (!GameManager.isAlive(sender.getUsername())) return false
        if (!GameManager.isAlive(voteTargetUsername)) return false
        return true
    }

    static verifyDAVote(socketId, voteTargetUsername) {
        const phase = GameManager.getPhaseType()
        if (phase !== 'DAY') return false
        const sender = GameManager.getPlayerFromSocketId(socketId)
        if (!sender) return false
        if (!GameManager.isAlive(sender.getUsername())) return false
        if (sender.getAlignment() !== 'MAFIA') return false
        if (!GameManager.isAlive(voteTargetUsername)) return false
        const target = GameManager.getPlayer(voteTargetUsername)
        if (target.getAlignment() !== 'MAFIA') return false
        return true
    }

}

module.exports = { IOVerifier }
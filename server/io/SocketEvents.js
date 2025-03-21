const { GameManager } = require('../utils/GameManager')
const { IOVerifier } = require('./IOVerifier')
const { IOManager } = require('./IOManager')
const { MessageType } = require('../objects/SharedChat')

const registerEvents = (socket) => {

    socket.on('CLICK_JOIN_GAME', ({ username }) => { // FOR NOW YOU CANNOT JOIN IF THE GAME HAS STARTED. THIS SHOULD BE CHANGED
        if (!IOVerifier.verifyJoinGame(socket.id, username)) {
            console.log(`Player (Socket ID: ${socket.id}, Username: ${username}) failed to join.`)
            socket.emit('JOIN_ERROR', {errorMessage: "Unable to join game."})
            return
        }

        GameManager.instantiatePlayer(socket.id, username)
        GameManager.lobbyChat.addMessage(MessageType.SERVER, '[SERVER]', `${username} connected.`)
        GameManager.lobbyChat.addRW(username)

        IOManager.globalEmit('PLAYER_JOIN', { username })
    })

    socket.on('CLICK_SEND_MESSAGE', ({ contents, chatId }) => {
        if (IOVerifier.verifyChatMessage(socket.id, contents, chatId)) {
            const senderName = GameManager.getPlayerFromSocketId(socket.id).username
            GameManager.getSharedChat(chatId).addMessage(MessageType.PLAYER_MESSAGE, senderName, contents)
        } else {socket.emit('GENERIC_ERROR', {errorMessage: "Could not send message."})}
    })

    socket.on('CLICK_SUBMIT_ABILITY', ({ abilityId, targetData }) => {
        if (IOVerifier.verifySubmitAbility(socket.id, abilityId, targetData)) {
            const user = GameManager.getPlayerFromSocketId(socket.id)
            const ability = user.getAbility(abilityId)
            ability.use(targetData)
        } else {socket.emit('GENERIC_ERROR', {errorMessage: "Could not use ability."})}
    })

    socket.on('CLICK_WHISPER_ACTION', ({ contents, recipient }) => {
        if (IOVerifier.verifySendWhisper(socket.id, contents, recipient)) {
            const sender = GameManager.getPlayerFromSocketId(socket.id).username
            GameManager.registerWhisper(sender, recipient, contents)
        } else {socket.emit('GENERIC_ERROR', {errorMessage: "Could not send whisper."})}
    })

    socket.on('CLICK_VOTE_ACTION', ({ target }) => {
        if (IOVerifier.verifyVote(socket.id, target)) {
            const voter = GameManager.getPlayerFromSocketId(socket.id).username
            GameManager.registerVote(voter, target)
        } else {socket.emit('GENERIC_ERROR', {errorMessage: "Could not send vote."})}
    })

    socket.on('CLICK_DA_VOTE_ACTION', ({ target }) => {
        if (IOVerifier.verifyDAvote(socket.id, target)) {
            const voter = GameManager.getPlayerFromSocketId(socket.id).username
            GameManager.registerDAvote(voter, target)
        } else {socket.emit('GENERIC_ERROR', {errorMessage: "Could not send DA vote."})}
    })
}

module.exports = { registerEvents }
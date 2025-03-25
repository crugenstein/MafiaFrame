const { MessageType } = require('../data/enums')
const { IOVerifier } = require('./IOVerifier')

const registerEvents = (socket, instance) => {

    socket.on('CLICK_JOIN_GAME', ({ username }) => { // FOR NOW YOU CANNOT JOIN IF THE GAME HAS STARTED. THIS SHOULD BE CHANGED
        if (!IOVerifier.verifyJoinGame(socket.id, username, instance)) {
            console.log(`Player (Socket ID: ${socket.id}, Username: ${username}) failed to join.`)
            socket.emit('JOIN_ERROR', {errorMessage: "Unable to join game."})
            return
        }

        instance.instantiatePlayer(socket.id, username)
        instance.lobbyChat.addMessage(MessageType.SERVER, '[SERVER]', `${username} connected.`)
        instance.lobbyChat.addRW(username)

        const id = instance.lobbyChat.chatId
        socket.emit('JOIN_SUCCESS', { lobbyChat: id })
    })

    socket.on('CLICK_SEND_MESSAGE', ({ contents, chatId }) => {
        if (IOVerifier.verifyChatMessage(socket.id, contents, chatId, instance)) {
            console.log('A message was successfully sent.')
            const senderName = instance.getPlayerFromSocketId(socket.id).username
            instance.getSharedChat(chatId).addMessage(MessageType.PLAYER_MESSAGE, senderName, contents)
        } else {socket.emit('GENERIC_ERROR', {errorMessage: "Could not send message."})}
    })

    socket.on('CLICK_SUBMIT_ABILITY', ({ abilityId, targetData }) => {
        if (IOVerifier.verifySubmitAbility(socket.id, abilityId, targetData, instance)) {
            const user = instance.getPlayerFromSocketId(socket.id)
            const ability = user.getAbility(abilityId)
            ability.use(targetData)
        } else {socket.emit('GENERIC_ERROR', {errorMessage: "Could not use ability."})}
    })

    socket.on('CLICK_WHISPER_ACTION', ({ contents, recipient }) => {
        if (IOVerifier.verifySendWhisper(socket.id, contents, recipient, instance)) {
            const sender = instance.getPlayerFromSocketId(socket.id).username
            instance.registerWhisper(sender, recipient, contents)
        } else {socket.emit('GENERIC_ERROR', {errorMessage: "Could not send whisper."})}
    })

    socket.on('CLICK_VOTE_ACTION', ({ target }) => {
        if (IOVerifier.verifyVote(socket.id, target, instance)) {
            const voter = instance.getPlayerFromSocketId(socket.id).username
            instance.registerVote(voter, target)
        } else {socket.emit('GENERIC_ERROR', {errorMessage: "Could not send vote."})}
    })

    socket.on('CLICK_DA_VOTE_ACTION', ({ target }) => {
        if (IOVerifier.verifyDAvote(socket.id, target, instance)) {
            const voter = instance.getPlayerFromSocketId(socket.id).username
            instance.registerDAvote(voter, target)
        } else {socket.emit('GENERIC_ERROR', {errorMessage: "Could not send DA vote."})}
    })
}

module.exports = { registerEvents }
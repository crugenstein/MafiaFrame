const { AbilityManager } = require('../utils/AbilityManager')
const { GameManager } = require('../utils/GameManager')
const { IOVerifier } = require('./IOVerifier')
const { IOManager } = require('./IOManager')
const { lobbyChat } = require('../server') // TODO

const socketEvents = (socket) => {

    socket.on('CLICK_JOIN_GAME', ({ username }) => { // FOR NOW YOU CANNOT JOIN IF THE GAME HAS STARTED. THIS SHOULD BE CHANGED

        if (!IOVerifier.verifyJoinGame(socket.id, username)) {
            console.log('Player failed to join.')
            IOManager.emitToRoom(socket.id, 'JOIN_ERROR', {errorMessage: "Unable to join game."})
            return
        }

        if (gameStatus === 'LOBBY_WAITING') {
            const lobbyChat = GameManager.getSharedChat('lobby')
            const newPlayer = GameManager.instantiatePlayer(socket.id, username)
            lobbyChat.addMessage(joinMessage)
            lobbyChat.addRW(newPlayer.getUsername())
        } // handle different logic if game has already started

        io.emit('CLIENT_PLAYER_ENTER_LOBBY', { username })
    })

    socket.on('CLICK_SEND_MESSAGE', ({ contents, chatId }) => {
        if (IOVerifier.verifyChatMessage(socket.id, contents, chatId)) {
            const senderName = GameManager.getPlayerFromSocketId(socket.id).getUsername()
            const message = {senderName, contents}
            GameManager.getSharedChat(chatId).addMessage(message)
        } else {
            //throw an error
        }
    })

    socket.on('DISCONNECT', () => { // TODO!!!

    })

    socket.on('CLICK_SUBMIT_ABILITY', ({ abilityUUID, targetData }) => {
        if (IOVerifier.verifySubmitAbility(socket.id, abilityUUID, targetData)) {
            const user = GameManager.getPlayerFromSocketId(socket.id)
            const ability = user.getAbility(abilityUUID)
            AbilityManager.queueAbility(user.getUsername(), abilityUUID, targetData)
            ability.spendUsage()
        } else {
            //throw an error
        }
    })

    socket.on('CLICK_WHISPER_ACTION', ({ recipientUsername, contents }) => {
        if (IOVerifier.verifySendWhisper(socket.id, recipientUsername, contents)) {
            const senderUsername = GameManager.getPlayerFromSocketId(socket.id).getUsername()
            GameManager.registerWhisper(senderUsername, recipientUsername, contents)
        } else {
            //throw an error
        }

    })

    socket.on('CLICK_VOTE_ACTION', ( { voteTargetUsername }) => {
        if (IOVerifier.verifyVote(socket.id, voteTargetUsername)) {
            const voterUsername = GameManager.getPlayerFromSocketId(socket.id).getUsername()
            GameManager.registerVote(voterUsername, voteTargetUsername)
        } else {
            //throw an error
        }
    })

    socket.on('CLICK_DA_VOTE_ACTION') ( ({ voteTargetUsername }) => {
        if (IOVerifier.verifyDAVote(socket.id, voteTargetUsername)) {
            const voterUsername = GameManager.getPlayerFromSocketId(socket.id).getUsername()
            GameManager.registerDAVote(voterUsername, voteTargetUsername)
        } else {
            //throw an error
        }
    })
}
const { AbilityManager } = require('../utils/AbilityManager')
const { GameManager } = require('../utils/GameManager')
const { IOVerifier } = require('./IOVerifier')
const { IOManager } = require('./IOManager')

const socketEvents = (socket) => {

    socket.on('CLICK_JOIN_GAME', ({ username }) => {

        if (!IOVerifier.verifyJoinGame(socket.id, username)) {
            console.log('Player tried joining with invalid username')
            //THROW CLIENTSIDE ERROR
            return
        }

        const joinMessage = { senderUsername: '[SERVER]', contents: `${username} connected.`}
        
        if (gameStatus === 'LOBBY_WAITING') {
            const lobbyChat = GameManager.getSharedChat('lobby')
            const newPlayer = GameManager.instantiatePlayer(socket.id, username)
            lobbyChat.addMessage(joinMessage)
            lobbyChat.addRW(newPlayer.getUsername())
        } // handle different logic if game has already started

        //below are temp to frontend io
        IOManager.emitToChat('lobby', 'RECEIVE_MESSAGE', {message: joinMessage, receivingChat: 'lobby'})
        io.emit('CLIENT_PLAYER_ENTER_LOBBY', { username })
    })

    socket.on('CLICK_SEND_MESSAGE', ({ message, chatId }) => {
        if (IOVerifier.verifyChatMessage(socket.id, message, chatId)) {
            GameManager.getSharedChat(chatId).addMessage(message)
            //addMessage should handle the io
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
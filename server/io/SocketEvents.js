const { AbilityManager } = require('../utils/AbilityManager')
const { GameManager } = require('../utils/GameManager')
const { IOVerifier } = require('./IOVerifier')
const { IOManager } = require('./IOManager')

const socketEvents = (socket) => {

    socket.on('CLICK_JOIN_GAME', ({ username }) => {

        const joinMessage = { senderUsername: '[SERVER]', contents: `${username} connected.`}
        
        if (gameStatus === 'LOBBY_WAITING') {
            const lobbyChat = GameManager.getSharedChat('lobby')
            GameManager.instantiatePlayer(socket.id, username)
            const newPlayer = GameManager.getPlayer(username)
            lobbyChat.addMessage(joinMessage)
            lobbyChat.addReader(newPlayer)
            lobbyChat.addWriter(newPlayer)
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
            const abilityUser = GameManager.getPlayerFromSocketId(socket.id)
            const ability = abilityUser.getAbility(abilityUUID)
            AbilityManager.queueAbility(abilityUser, ability, targetData)
            abilityUser.spendAbilityUsage(ability)
            //should send io back to client updating the ability counts
        } else {
            //throw an error
        }
    })

    socket.on('CLICK_WHISPER_ACTION', ({ recipientUsername, contents }) => {
        if (IOVerifier.verifySendWhisper(socket.id, recipientUsername, contents)) {
            const whisperSender = GameManager.getPlayerFromSocketId(socket.id)
            const whisperRecipient = GameManager.getPlayer(recipientUsername)
            GameManager.registerWhisper(whisperSender, whisperRecipient, contents)
        } else {
            //throw an error
        }

    })

    socket.on('CLICK_VOTE_ACTION', ( { voteTargetUsername }) => {
        if (IOVerifier.verifyVote(socket.id, voteTargetUsername)) {
            const voter = GameManager.getPlayerFromSocketId(socket.id)
            const target = GameManager.getPlayer(voteTargetUsername)
            GameManager.registerVote(voter, target)
        } else {
            //throw an error
        }
    })
}
const { AbilityManager } = require('../utils/AbilityManager')
const { GameManager } = require('../utils/GameManager')
const { IOVerifier } = require('./IOVerifier')

const socketEvents = (io, socket) => {

    socket.on('CLICK_JOIN_GAME', ({ username }) => {
        
        if (gameStatus === 'LOBBY_WAITING') {
            const lobbyChat = GameManager.getSharedChat('lobby')
            const joinMessage = { senderUsername: '[SERVER]', contents: `${username} connected.`}
            GameManager.instantiatePlayer(socket.id, username)
            const newPlayer = GameManager.getPlayer(username)
            lobbyChat.addMessage(joinMessage)
            lobbyChat.addReader(newPlayer)
            lobbyChat.addWriter(newPlayer)
        } // handle different logic if game has already started

        //below are temp to frontend io
        io.to('lobby').emit('receive_message', { sender: '[SERVER]', contents: username + ' connected.', receivingChatId: 'lobby' })
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

    socket.on('DISCONNECT', () => {

    })

    socket.on('CLICK_SUBMIT_ABILITY', ({ ability, targetData }) => {
        if (IOVerifier.verifySubmitAbility(socket.id, ability, targetData)) {
            const abilityUser = GameManager.getPlayerFromSocketId(socket.id)
            AbilityManager.queueAbility(abilityUser, ability, targetData)
            abilityUser.spendAbilityUsage(ability)
            //other stuff?
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
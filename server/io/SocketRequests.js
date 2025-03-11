const { IOManager } = require('./IOManager')
const { GameManager } = require('../utils/GameManager')
const { IOVerifier } = require('./IOVerifier')

// FETCH for player list (with their statuses and votes) [SHOULD ALSO RETURN GAME STATE STUFF I THINK]

// FETCH for a player's Role data

const socketRequests = (socket) => {

    socket.on('REQUEST_ABILITY_INFO', () => {
        const player = GameManager.getPlayerFromSocketId(socket.id)
        const abilityData = player.getAllAbilityData()

        IOManager.emitToPlayer(player.getUsername(), 'RECEIVE_ABILITY_INFO', {
            abilityData
        })
    })

    socket.on('REQUEST_NOTIF_INFO', () => {
        const player = GameManager.getPlayerFromSocketId(socket.id)

        IOManager.emitToPlayer(player.getUsername(), 'RECEIVE_NOTIF_INFO', {
            notifications: player.getNotifications()
        })
    })

    socket.on('REQUEST_SHARED_CHAT_MESSAGES', ({chatId}) => {
        const player = GameManager.getPlayerFromSocketId(socket.id)

        if (IOVerifier.verifyChatRead(socket.id, chatId)) {
            const chatMessages = GameManager.getSharedChat(chatId).getMessages()
            IOManager.emitToPlayer(player.getUsername, 'RECEIVE_CHAT_MESSAGES', {
                chatId,
                messages: chatMessages
            })
        }
    })

    socket.on('REQUEST_SHARED_CHATS', () => {
        const player = GameManager.getPlayerFromSocketId(socket.id)
        
        IOManager.emitToPlayer(player.getUsername, 'RECEIVE_SHARED_CHATS', {
            chatData: player.getReadableChatData()
        })
    })

    socket.on('REQUEST_ROLE_INFO', () => {


    })

}
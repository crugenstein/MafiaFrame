const { IOManager } = require('./IOManager')
const { GameManager, GameStatus } = require('../utils/GameManager')
const { IOVerifier } = require('./IOVerifier')
const { PlayerAlignment } = require('../objects/Player')

// FETCH for player list (with their statuses and votes) [SHOULD ALSO RETURN GAME STATE STUFF I THINK]

// FETCH for a player's Role data

const socketRequests = (socket) => {

    socket.on('FETCH_PLAYER_LIST', () => {
        const player = GameManager.getPlayerFromSocketId(socket.id)
        let playerList = [] 
        GameManager.allPlayers.forEach((username) => {
            let visibleStatus = 'UNKNOWN'
            if (player.alignment === PlayerAlignment.MAFIA) {visibleStatus = 'MAFIA'}
            playerList.push({username, visibleStatus})
        })

        IOManager.emitToPlayer(player.username, 'RECEIVE_PLAYER_LIST', {
            playerList
        })
    })

    socket.on('REQUEST_NOTIF_INFO', () => {
        const player = GameManager.getPlayerFromSocketId(socket.id)
        const notifications = player.getNotifications()

        IOManager.emitToPlayer(player.getUsername(), 'RECEIVE_NOTIF_INFO', {
            notifications
        })
    })

    socket.on('REQUEST_SHARED_CHAT_MESSAGES', ({chatId}) => {
        const player = GameManager.getPlayerFromSocketId(socket.id)

        if (IOVerifier.verifyChatRead(socket.id, chatId)) {
            const chatMessages = GameManager.getSharedChat(chatId).getMessages()
            IOManager.emitToPlayer(player.getUsername(), 'RECEIVE_CHAT_MESSAGES', {
                chatId,
                messages: chatMessages
            })
        }
    })

    socket.on('REQUEST_SHARED_CHATS', () => {
        const player = GameManager.getPlayerFromSocketId(socket.id)
        const chats = player.getReadableChatData()
        
        IOManager.emitToPlayer(player.getUsername(), 'RECEIVE_SHARED_CHATS', {
            chats
        })
    })

    socket.on('REQUEST_ROLE_INFO', () => {

    })
}
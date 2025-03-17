const { GameManager } = require('../utils/GameManager')

class IOManager {
    static io = null

    static setIO(instance) {
        this.io = instance
    }

    static globalEmit(event, message) {
        if (this.io) {
            this.io.emit(event, message)
        } else {console.log('ERROR: NO IO ON EMIT')}
    }

    static emitToRoom(chatId, event, message) {
        if (this.io) {
            this.io.to(chatId).emit(event, message)
        } else {console.log('ERROR: NO IO ON EMIT TO CHAT')}
    }

    static emitToMafia(event, message) {
        if (this.io) {
            const mafiaChat = GameManager.mafiaChat.chatId
            this.io.to(mafiaChat).emit(event, message)
        }
    }

    static emitToPlayer(username, event, message) {
        if (this.io) {
            const player = GameManager.getPlayer(username)
            if (player) {
                const receiverSocket = player.getSocketId()
                this.io.to(receiverSocket).emit(event, message)
            } else {
                console.log('ERROR: NO PLAYER EXISTS TO EMIT TO')
            }
        } else {
            console.log('ERROR: NO IO TO EMIT TO PLAYER')
        }
    }

    static addPlayerToRoom(username, roomId) {
        const socketId = GameManager.getPlayer(username)
        const socket = this.io.sockets.sockets.get(socketId)
        socket.join(roomId)
    }
    
    static removePlayerFromRoom(username, roomId) {
        const socketId = GameManager.getPlayer(username)
        const socket = this.io.sockets.sockets.get(socketId)
        socket.leave(roomId)
    }
}

module.exports = { IOManager }
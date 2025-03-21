const { GameManager } = require('../utils/GameManager')

class IOManager {

    static _io = null

    static get io() {
        return this._io
    }

    static set io(instance) {
        this._io = instance
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
                const receiverSocket = player.socketId
                this.io.to(receiverSocket).emit(event, message)
            } else {
                console.log(`${username} does not exist as a player, so failed to emit`)
            }
        } else {
            console.log('ERROR: NO IO TO EMIT TO PLAYER')
        }
    }

    static addPlayerToRoom(username, roomId) {
        const socketId = GameManager.getPlayer(username)?.socketId
        const socket = this.io.sockets.sockets.get(socketId)
        socket?.join(roomId)
    }
    
    static removePlayerFromRoom(username, roomId) {
        const socketId = GameManager.getPlayer(username)?.socketId
        const socket = this.io.sockets.sockets.get(socketId)
        socket?.leave(roomId)
    }
}

module.exports = { IOManager }
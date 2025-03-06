const { IOManager } = require('../io/IOManager')

class SharedChat {
    constructor(chatId, readers, writers) {
        this.chatId = chatId
        this.readers = new Set()
        readers.forEach((readerName) => {this.addReader(readerName)})
        this.writers = new Set()
        writers.forEach((writerName) => {this.addWriter(writerName)})
        this.messages = []
    }

    addReader(playerName) {
        this.readers.add(playerName)
        IOManager.addPlayerToRoom(playerName, this.chatId)
        IOManager.emitToPlayer(playerName, 'NEW_CHAT_READ_ACCESS', {chatId: this.chatId})
    }

    addWriter(playerName) {
        this.writers.add(playerName)
        IOManager.emitToPlayer(playerName, 'NEW_CHAT_WRITE_ACCESS', {chatId: this.chatId})
    }

    addRW(playerName) {
        this.addReader(playerName)
        this.addWriter(playerName)
    }

    canRead(playerName) {
        return this.readers.has(playerName)
    }

    canWrite(playerName) {
        return this.writers.has(playerName)
    }

    revokeRead(playerName) {
        this.readers.delete(playerName)
        IOManager.removePlayerFromRoom(playerName, this.chatId)
        IOManager.emitToPlayer(playerName, 'LOST_CHAT_READ_ACCESS', {chatId: this.chatId})
    }

    revokeWrite(playerName) {
        this.writers.delete(playerName)
        IOManager.emitToPlayer(playerName, 'LOST_CHAT_WRITE_ACCESS', {chatId: this.chatId})
    }

    revokeRW(playerName) {
        this.revokeRead(playerName)
        this.revokeWrite(playerName)
    }

    getMessages() {
        return messages
    }

    addMessage(message) {
        this.messages = [...this.messages, message]
        IOManager.emitToChat(this.chatId, 'NEW_MESSAGE', message)
    }

}

module.exports = { SharedChat }
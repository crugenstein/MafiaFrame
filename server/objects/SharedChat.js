const { IOManager } = require('../io/IOManager')

class SharedChat {
    constructor(chatId) {
        this.chatId = chatId
        this.readers = new Set()
        this.writers = new Set()
        this.messages = []
    }

    addReader(playerName) {
        this.readers.add(playerName)
        IOManager.addPlayerToRoom(playerName, this.chatId)
    }

    addWriter(playerName) {
        this.writers.add(playerName)
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
    }

    revokeWrite(playerName) {
        this.writers.delete(playerName)
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
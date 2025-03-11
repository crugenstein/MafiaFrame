const { IOManager } = require('../io/IOManager')

class SharedChat { // TODO OVERHAUL
    constructor(chatId, name, readers, writers) {
        this.name = name
        this.chatId = chatId
        this.readers = new Set()
        readers.forEach((readerName) => {this.addReader(readerName)})
        this.writers = new Set()
        writers.forEach((writerName) => {this.addWriter(writerName)})
        this.messages = []
    }

    addReader(playerName) {
        const player = GameManager.getPlayer(playerName)
        player.addReadableChat(this.name, this.chatId)
        this.readers.add(playerName)
        IOManager.addPlayerToRoom(playerName, this.chatId)
        IOManager.emitToPlayer(playerName, 'NEW_CHAT_READ_ACCESS', {chatId: this.chatId})
    }

    addWriter(playerName) {
        const player = GameManager.getPlayer(playerName)
        player.addWriteableChat(this.name, this.chatId)
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
        const player = GameManager.getPlayer(playerName)
        player.removeReadableChat(this.chatId)
        this.readers.delete(playerName)
        IOManager.removePlayerFromRoom(playerName, this.chatId)
        IOManager.emitToPlayer(playerName, 'LOST_CHAT_READ_ACCESS', {chatId: this.chatId})
    }

    revokeWrite(playerName) {
        const player = GameManager.getPlayer(playerName)
        player.removeWriteableChat(this.chatId)
        this.writers.delete(playerName)
        IOManager.emitToPlayer(playerName, 'LOST_CHAT_WRITE_ACCESS', {chatId: this.chatId})
    }

    revokeRW(playerName) {
        this.revokeRead(playerName)
        this.revokeWrite(playerName)
    }

    getMessages() {
        return this.messages
    }

    getName() {
        return this.name
    }

    addMessage(senderName, contents) {
        const message = {senderName, contents, receiver: this.chatId}
        this.messages = [...this.messages, message]
        IOManager.emitToChat(this.chatId, 'NEW_MESSAGE', message)
    }

}

module.exports = { SharedChat }
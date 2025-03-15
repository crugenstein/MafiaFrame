const { IOManager } = require('../io/IOManager')
const { v4: uuidv4 } = require('uuid')

const MessageType = Object.freeze({
    SERVER: 0,
    VOTE: 1,
    PLAYER_MESSAGE: 2
})

class SharedChat { // TODO OVERHAUL
    constructor(name, readers, writers) {
        this.name = name
        this.chatId = uuidv4()
        this.readers = new Set()
        readers.forEach((readerName) => {this.addReader(readerName)})
        this.writers = new Set()
        writers.forEach((writerName) => {this.addWriter(writerName)})
        this.messages = []
    }

    addReader(playerName) {
        const player = GameManager.getPlayer(playerName)

        player.chatsCanRead.add(this.chatId)
        this.readers.add(playerName)

        IOManager.addPlayerToRoom(playerName, this.chatId)
        IOManager.emitToPlayer(playerName, 'NEW_CHAT_READ_ACCESS', {chatId: this.chatId})
    }

    addWriter(playerName) {
        const player = GameManager.getPlayer(playerName)

        player.chatsCanWrite.add(this.chatId)
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

    get name() {return this._name}

    addMessage(messageType, senderName, contents) {
        const message = {messageType, senderName, contents, receiver: this.chatId}
        this.messages = [...this.messages, message]
        IOManager.emitToChat(this.chatId, 'NEW_MESSAGE', message)
    }

}

module.exports = { SharedChat, MessageType }
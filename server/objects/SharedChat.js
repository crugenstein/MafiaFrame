const { GameManager } = require('../utils/GameManager')
const { IOManager } = require('../io/IOManager')
const { v4: uuidv4 } = require('uuid')

class SharedChat {
    /**
    * Creates a new shared chat object. It receives a random UUID. Readers and writers are notified of gained access.
    * Writers should be a subset of readers.
    * @param {string} name - The name of the Shared Chat.
    * @param {Array<string>} [readers] - List of player names to grant read access to.
    * @param {Array<string>} [writers] - List of player names to grant write access to.
    */
    constructor(name, readers = [], writers = []) {
        this._name = name
        this._chatId = uuidv4()

        readers.forEach((readerName) => {this.addReader(readerName)})
        writers.forEach((writerName) => {this.addWriter(writerName)})

        this._messages = []
    }

    /**
    * Grants a player read access, sending the client a notification with chat data (including message history).
    * @param {string} playerName - The name of the player to give read access to.
    */
    addReader(playerName) {
        const player = GameManager.getPlayer(playerName)

        player.readableChats.add(this.chatId)
        IOManager.addPlayerToRoom(playerName, this.chatId)
        IOManager.emitToPlayer(playerName, 'NEW_CHAT_READ_ACCESS', {chatId: this.chatId, name: this.name, messages: this.messages})
    }

    /**
    * Grants a player read/write access, sending the client a notification with chat id.
    * @param {string} playerName - The name of the player to give read/write access to.
    */
    addRW(playerName) {
        this.addReader(playerName)
        const player = GameManager.getPlayer(playerName)
        
        player.writeableChats.add(this.chatId)
        IOManager.emitToPlayer(playerName, 'NEW_CHAT_WRITE_ACCESS', {chatId: this.chatId})
    }

    /**
    * Whether or not a player can read this shared chat.
    * @param {string} playerName - The player name to check.
    * @returns {boolean} Whether or not the player has read access.
    */
    canRead(playerName) {
        const player = GameManager.getPlayer(playerName)
        if (!player) return false
        else {return player.readableChats.has(this.chatId)}
    }

    /**
    * Whether or not a player can write to this shared chat.
    * @param {string} playerName - The player name to check.
    * @returns {boolean} Whether or not the player has write access.
    */
    canWrite(playerName) {
        const player = GameManager.getPlayer(playerName)
        if (!player) return false
        else {return player.writeableChats.has(this.chatId)}
    }

    /**
    * Revokes a player's read/write access and notifies them.
    * @param {string} playerName - The player name to revoke access from.
    */
    revokeRW(playerName) {
        const player = GameManager.getPlayer(playerName)
        this.revokeWrite(playerName)

        player.readableChats.delete(this.chatId)
        IOManager.removePlayerFromRoom(playerName, this.chatId)
        IOManager.emitToPlayer(playerName, 'LOST_CHAT_READ_ACCESS', {chatId: this.chatId})
    }

    /**
    * Revokes a player's write access and notifies them.
    * @param {string} playerName - The player name to revoke access from.
    */
    revokeWrite(playerName) {
        const player = GameManager.getPlayer(playerName)

        player.writeableChats.delete(this.chatId)
        IOManager.emitToPlayer(playerName, 'LOST_CHAT_WRITE_ACCESS', {chatId: this.chatId})
    }

    /** Removes write access from all players. */
    writeLock() {
        const players = GameManager.allPlayers
        players.forEach((playerName) => {this.revokeWrite(playerName)})
    }

    /** @returns {Array<{messageType: number, senderName: string, contents: string}>} - Array of messages sent here. */
    get messages() {return this._messages}

    /** @returns {string} - The name of this Shared Chat. */
    get name() {return this._name}

    /** @returns {string} - The id of this Shared Chat. */
    get chatId() {return this._chatId}

    /**
    * Adds a message to the shared chat and notifies its readers with a payload containing relevant message data.
    * @param {number} messageType - The message type. Refer to MessageType enum for translation.
    * @param {string} senderName - The name of the sender. Use '[SERVER]' for non-player messages.
    * @param {string} contents - The contents of the message.
    */
    addMessage(messageType, senderName, contents) {
        const message = {messageType, senderName, contents}
        this.messages = [...this.messages, message]

        IOManager.emitToRoom(this.chatId, 'NEW_MESSAGE', {message, receiver: this.chatId})
    }

    /** Fetches the SharedChat data that should be visible to its owner clientside.
    * @returns {{id: string, name: string, messages: Array<{messageType: number, senderName: string, contents: string}>}} The chat's visible data.
    */
    getVisibleData() {
        return ({
            id: this.chatId,
            name: this.name,
            messages: this.messages,
        })
    }
}

module.exports = { SharedChat }
class SharedChat {
    constructor(chatId) {
        this.chatId = chatId
        this.readers = new Set()
        this.writers = new Set()
        this.messages = []
    }

    addReader(player) {
        this.readers.add(player)
    }

    addWriter(player) {
        this.writers.add(player)
    }

    canRead(player) {
        return this.readers.has(player)
    }

    canWrite(player) {
        return this.writers.has(player)
    }

    revokeRead(player) {
        this.readers.delete(player)
    }

    revokeWrite(player) {
        this.writers.delete(player)
    }

    getMessages() {
        return messages
    }

    addMessage(message) {
        this.messages = [...this.messages, message]
    }

}

module.exports = { SharedChat }
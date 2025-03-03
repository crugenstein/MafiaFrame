class Player {
    constructor(socketId) {
        this.socketId = socketId
        
        this.status = 'SPEC'  // 'ALIVE', 'DEAD', or 'SPEC'
        this.admin = false

        this.role = null
        this.abilities = []
    }
}

module.exports = { Player }
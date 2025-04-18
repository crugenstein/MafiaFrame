const { GameManager } = require('../utils/GameManager')


class TestGame {
    
    constructor() {
        if (TestGame.instance) {return TestGame.instance}

        TestGame.instance = this

        this._instance = GameManager.getInstance()
        this._instance.phaseLength = 1
        
        this._testDistro = []
        this._playerUsernames = []
        this._players = new Map()
    }


    addPlayer(username, roleKey = 'PLACEHOLDER_GUARD') {
        const newPlayer = this._instance.instantiatePlayer(username, username)
        if (newPlayer) {
            this._playerUsernames.push(username)
            this._testDistro.push({username: username, roleKey: roleKey})
            this._players.set(username, newPlayer)
        }
        
        return newPlayer
    }

    startGame(distro = this.testDistribute(this._testDistro)) {
        this._instance.startGameLoop()
        this._instance.startGame(distro)
        this._instance.stopGameLoop()
    }

    testDistribute(distro) {
        return ( (inst) => {
            distro.map(({ username, roleKey }) => {
                inst.getPlayer(username).assignRole(roleKey)
            })
        })
    }

    nextPhase() {
        this._instance.onInterval()
    }

    get i() {return this._instance}

    get playerUsernames() {return this._playerUsernames}

    get players() {return this._players}

}

module.exports = { TestGame }


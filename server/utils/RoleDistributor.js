const { GameManager } = require('./GameManager')
const { roleDictionary } = require('../data/roles')

const mafiaProportion = 0.3

class RoleDistributor {

    static generate() {
        let assignments = new Map() // KEY is username, value is Rolekey
        let mafiaRoles = []
        let townRoles = []

        const shuffle = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                [array[i], array[j]] = [array[j], array[i]]
            }
            return array
        }

        const remove = (array, roleKey) => {
            const index = array.indexOf(roleKey)
            if (index !== -1) {
                array.splice(index, 1);
            }
        }

        const assign = (playerName, roleKey) => {
            assignments.set(playerName, roleKey)
            const role = roleDictionary[roleKey]

            if (role.alignment === 'MAFIA') {
                mafiasAssigned++
                if (role.unique === true) {
                    remove(mafiaRoles, roleKey)
                }
            } else if (role.alignment === 'TOWN') {
                if (role.unique === true) {
                    remove(townRoles, roleKey)
                }
            }
        }

        Object.entries(roleDictionary).forEach(([key, role]) => {
            if (role.alignment === 'MAFIA') {
                mafiaRoles.push(key)
            } else if (role.alignment === 'TOWN') {
                townRoles.push(key)
            }
        })

        const playerList = shuffle(GameManager.getAllUsernames())
        const mafiaCount = Math.floor(playerList.length * mafiaProportion)
        let mafiasAssigned = 0
        let godfatherAssigned = false

        playerList.forEach((playerUsername) => {
            if (mafiasAssigned < mafiaCount) {
                if (!godfatherAssigned) {
                    assign(playerUsername, 'PLACEHOLDER_GODFATHER')
                    godfatherAssigned = true
                }
                const roleKey = mafiaRoles[Math.floor(Math.random() * mafiaRoles.length)]
                assign(playerUsername, roleKey)
            } else {
                const roleKey = townRoles[Math.floor(Math.random() * townRoles.length)]
                assign(playerUsername, roleKey)
            }
        })

        return assignments
    }
}

module.exports = { RoleDistributor } 
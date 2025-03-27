const { PlayerAlignment } = require('../data/enums')
const { roleDictionary } = require('../data/roles')

const mafiaProportion = 0.3

class RoleDistributor { // this logic is temporary. This should be made more robust once frontend done

    static distribute(instance) {

        let mafiaRoles = []
        let townRoles = []

        const shuffle = (array) => {
            console.log(array)
            for (let i = array.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1))
                let temp = array[i]
                array[i] = array[j]
                array[j] = temp
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
            instance.getPlayer(playerName).assignRole(roleKey)
            const role = roleDictionary[roleKey]

            if (role.alignment === PlayerAlignment.MAFIA) {
                mafiasAssigned++
                if (role.unique) {
                    remove(mafiaRoles, roleKey)
                }
            } else if (role.alignment === PlayerAlignment.TOWN) {
                if (role.unique) {
                    remove(townRoles, roleKey)
                }
            }
        }

        Object.entries(roleDictionary).forEach(([key, role]) => {
            if (role.alignment === PlayerAlignment.MAFIA) {
                mafiaRoles.push(key)
            } else if (role.alignment === PlayerAlignment.TOWN) {
                townRoles.push(key)
            }
        })

        const playerList = shuffle(instance.allPlayers)
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
    }
}

module.exports = { RoleDistributor } 
const { GameManager } = require('../utils/GameManager')

const AbilityTag = {
    DAY: 0, // use only during day
    NIGHT: 1, // use only during night
    DESIGNATED: 2, // need DA status to use it
    ASTRAL: 3 // does not visit
}

const abilityDictionary = {
    "PLACEHOLDER_INVESTIGATE": {
        name: "Investigate (PLACEHOLDER)",
        description: "Select a target. You will learn their Role.",
        effect: ({userName, targetName}) => {
            user = GameManager.getPlayer(userName)
            target = GameManager.getPlayer(targetName)

            const role = target.getRoleName()
            user.notif(`You used Investigate.`)
            user.notif(`${targetName}\'s role is ${role}.`)
        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: [AbilityTag.NIGHT],
        priority: 6
    },
    "PLACEHOLDER_MAFIA_KILL": {
        name: "Attack (PLACEHOLDER)",
        description: "You must be the Mafia's Designated Attacker to use this. Select a target. You will deal them a Basic Attack.",
        effect: ({userName, targetName}) => {
            user = GameManager.getPlayer(userName)
            target = GameManager.getPlayer(targetName)

            if (GameManager.registerAttack(userName, targetName, 1)) {
                user.notif(`You killed ${targetName} with Mafia Attack.`)
            } else {
                user.notif(`You tried killing ${targetName} with Mafia Attack, but it failed.`)
            }
        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: [AbilityTag.NIGHT, AbilityTag.DESIGNATED],
        priority: 9
    },
    "PLACEHOLDER_PROTECT": {
        name: "Protect (PLACEHOLDER)",
        description: "Select a target. You will grant them Basic Defense.",
        effect: ({userName, targetName}) => {
            user = GameManager.getPlayer(userName)
            target = GameManager.getPlayer(targetName)

            target.setDefense(1)
            user.notif(`You used Protect on ${targetName}.`)
        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: [AbilityTag.NIGHT],
        priority: 3
    }
}

module.exports = { abilityDictionary, AbilityTag }
const { GameManager } = require('../utils/GameManager')

const abilityDictionary = {
    "PLACEHOLDER_INVESTIGATE": {
        name: "Investigate (PLACEHOLDER)",
        description: "Select a target. You will learn their Role.",
        effect: ({user, target}) => {
            const role = target.getRoleName()
            user.notif(`You used Investigate.`)
            user.notif(`${target.getUsername()}\'s role is ${role}.`)
        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: new Set(["NIGHT"]),
        priority: 6
    },
    "PLACEHOLDER_MAFIA_KILL": {
        name: "Attack (PLACEHOLDER)",
        description: "You must be the Mafia's Designated Attacker to use this. Select a target. You will deal them a Basic Attack.",
        effect: ({user, target}) => {
            if (GameManager.registerAttack(user, target, 1)) {
                user.notif(`You killed ${target} with Mafia Attack.`)
            } else {
                user.notif(`You tried killing ${target} with Mafia Attack, but it failed.`)
            }
        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: new Set(["DESIGNATED", "NIGHT"]),
        priority: 9
    },
    "PLACEHOLDER_PROTECT": {
        name: "Protect (PLACEHOLDER)",
        description: "Select a target. You will grant them Basic Defense.",
        effect: ({user, target}) => {
            target.setDefense(1)
            user.notif(`You used Protect on ${target.getUsername()}.`)
        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: new Set(["NIGHT"]),
        priority: 3
    }
}

module.exports = { abilityDictionary }
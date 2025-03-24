const { NotificationType, AbilityTag } = require('../data/enums')
const { GameManager } = require('../utils/GameManager')

const abilityDictionary = {
    "PLACEHOLDER_INVESTIGATE": {
        name: "Investigate (PLACEHOLDER)",
        description: "Select a target. You will learn their Role.",
        effect: ({user, target}) => {
            const userPlayer = GameManager.getPlayer(user)
            const targetPlayer = GameManager.getPlayer(target)

            const role = targetPlayer.roleName
            userPlayer.notif(NotificationType.ABILITY_RESULT, `You used Investigate.`)
            userPlayer.notif(NotificationType.ABILITY_RESULT, `${target}\'s role is ${role}.`)
        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: [AbilityTag.NIGHT],
        priority: 6
    },
    "PLACEHOLDER_MAFIA_KILL": {
        name: "Attack (PLACEHOLDER)",
        description: "You must be the Mafia's Designated Attacker to use this. Select a target. You will deal them a Basic Attack.",
        effect: ({user, target}) => {
            const userPlayer = GameManager.getPlayer(user)

            if (GameManager.registerAttack(user, target, 1)) {userPlayer.notif(NotificationType.ABILITY_RESULT, `You killed ${target} with Mafia Attack.`)} 
            else {userPlayer.notif(NotificationType.ABILITY_RESULT, `You tried killing ${target} with Mafia Attack, but it failed.`)}
        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: [AbilityTag.NIGHT, AbilityTag.DESIGNATED],
        priority: 9
    },
    "PLACEHOLDER_PROTECT": {
        name: "Protect (PLACEHOLDER)",
        description: "Select a target. You will grant them Basic Defense.",
        effect: ({user, target}) => {
            const userPlayer = GameManager.getPlayer(user)
            const targetPlayer = GameManager.getPlayer(target)

            targetPlayer.grantDefense(1)
            userPlayer.notif(NotificationType.ABILITY_RESULT, `You used Protect on ${target}.`)
        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: [AbilityTag.NIGHT],
        priority: 3
    }
}

module.exports = { abilityDictionary }
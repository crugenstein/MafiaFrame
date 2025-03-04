const { GameManager } = require('../utils/GameManager')

const abilityDictionary = {
    "PLACEHOLDER_INVESTIGATE": {
        name: "Investigate (PLACEHOLDER)",
        description: "Select a target. You will learn their Role.",
        effect: ({user, target}) => {

        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: new Set(["NIGHT"])
    },
    "PLACEHOLDER_MAFIA_KILL": {
        name: "Attack (PLACEHOLDER)",
        description: "You must be the Mafia's Designated Attacker to use this. Select a target. You will deal them a Basic Attack.",
        effect: ({user, target}) => {

        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: new Set(["DESIGNATED", "NIGHT"])
    },
    "PLACEHOLDER_PROTECT": {
        name: "Protect (PLACEHOLDER)",
        description: "Select a target. You will grant them Basic Defense.",
        effect: ({user, target}) => {

        },
        selections: ["SELECT_SINGLE_PLAYER_TARGET"],
        tags: new Set(["NIGHT"])
    }
}

module.exports = { abilityDictionary }
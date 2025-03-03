const abilityDictionary = {
    "PLACEHOLDER_INVESTIGATE": {
        name: "Investigate (PLACEHOLDER)",
        description: "Select a target. You will learn their Role.",
        effect: () => {

        },
        selectionBoxes: ["SELECT_SINGLE_TARGET"],
        tags: new Set(["NIGHT"])
    },
    "PLACEHOLDER_MAFIA_KILL": {
        name: "Attack (PLACEHOLDER)",
        description: "You must be the Mafia's Designated Attacker to use this. Select a target. You will deal them a Basic Attack.",
        effect: () => {

        },
        selectionBoxes: ["SELECT_SINGLE_TARGET"],
        tags: new Set(["DESIGNATED", "NIGHT"])
    },
    "PLACEHOLDER_PROTECT": {
        name: "Protect (PLACEHOLDER)",
        description: "Select a target. You will grant them Basic Defense.",
        effect: () => {

        },
        selectionBoxes: ["SELECT_SINGLE_TARGET"],
        tags: new Set(["NIGHT"])
    }
}

module.exports = { abilityDictionary }
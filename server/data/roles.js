const roleDictionary = {
    "PLACEHOLDER_DETECTIVE": {
        name: "Detective (Placeholder)",
        alignment: "TOWN",
        class: "INVESTIGATIVE",
        abilities: [
            {abilityKey: "PLACEHOLDER_INVESTIGATE", abilityCount: 2}
        ],
        defense: 0
    },
    "PLACEHOLDER_GUARD": {
        name: "Guard (Placeholder)",
        alignment: "TOWN",
        class: "PROTECTIVE",
        abilities: [
            {abilityKey: "PLACEHOLDER_PROTECT", abilityCount: Infinity}
        ],
        defense: 0
    },
    "PLACEHOLDER_MAFIOSO": {
        name: "Mafioso (Placeholder)",
        alignment: "MAFIA",
        class: "KILLING",
        abilities: [
            {abilityKey: "PLACEHOLDER_MAFIA_KILL", abilityCount: Infinity}
        ],
        defense: 0
    },
    "PLACEHOLDER_GODFATHER": {
        name: "Godfather (Placeholder)",
        alignment: "MAFIA",
        class: "KILLING",
        abilities: [
            {abilityKey: "PLACEHOLDER_MAFIA_KILL", abilityCount: Infinity},
            {abilityKey: "PLACEHOLDER_INVESTIGATE", abilityCount: 1}
        ],
        defense: 1
    }
}

module.exports = { roleDictionary }
const { PlayerAlignment } = require('../data/enums')

const roleDictionary = {
    "PLACEHOLDER_DETECTIVE": {
        name: "Detective",
        alignment: PlayerAlignment.TOWN,
        class: "INVESTIGATIVE",
        abilities: [
            {abilityKey: "PLACEHOLDER_INVESTIGATE", abilityCount: 2}
        ],
        defense: 0,
        unique: false
    },
    "PLACEHOLDER_GUARD": {
        name: "Guard",
        alignment: PlayerAlignment.TOWN,
        class: "PROTECTIVE",
        abilities: [
            {abilityKey: "PLACEHOLDER_PROTECT", abilityCount: Infinity}
        ],
        defense: 0,
        unique: false
    },
    "PLACEHOLDER_MAFIOSO": {
        name: "Mafioso",
        alignment: PlayerAlignment.MAFIA,
        class: "KILLING",
        abilities: [
            {abilityKey: "PLACEHOLDER_MAFIA_KILL", abilityCount: Infinity}
        ],
        defense: 0,
        unique: false
    },
    "PLACEHOLDER_GODFATHER": {
        name: "Godfather",
        alignment: PlayerAlignment.MAFIA,
        class: "KILLING",
        abilities: [
            {abilityKey: "PLACEHOLDER_MAFIA_KILL", abilityCount: Infinity},
            {abilityKey: "PLACEHOLDER_INVESTIGATE", abilityCount: 1}
        ],
        defense: 1,
        unique: true
    }
}

module.exports = { roleDictionary }
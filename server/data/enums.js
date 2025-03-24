const PlayerStatus = Object.freeze({
    SPECTATOR: 0,
    ALIVE: 1,
    DEAD: 2
})

const PlayerAlignment = Object.freeze({
    TOWN: 0,
    MAFIA: 1,
    NEUTRAL: 2
})

const NotificationType = Object.freeze({
    ABILITY_RESULT: 0,
    WHISPER: 1,
    SERVER: 2
})

const AbilityTag = Object.freeze({
    DAY: 0, // use only during day
    NIGHT: 1, // use only during night
    DESIGNATED: 2, // need DA status to use it
    ASTRAL: 3 // does not visit
})

const MessageType = Object.freeze({
    SERVER: 0,
    VOTE: 1,
    PLAYER_MESSAGE: 2
})

const GameStatus = Object.freeze({
    LOBBY_WAITING: 0,
    LOBBY_COUNTDOWN: 1,
    ROLLOVER: 2,
    IN_PROGRESS: 3,
    GAME_FINISHED: 4
})

const PhaseType = Object.freeze({
    LOBBY: 0,
    DAY: 1,
    NIGHT: 2
})

module.exports = { PlayerStatus, PlayerAlignment, NotificationType, AbilityTag, MessageType, GameStatus, PhaseType }
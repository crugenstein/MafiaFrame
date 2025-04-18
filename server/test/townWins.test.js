const { Player } = require('../objects/Player')
const { TestGame } = require('./TestGame')
const { IOManager } = require('../io/IOManager')
const { AbilityManager } = require('../utils/AbilityManager')
const { GameStatus, PhaseType, PlayerStatus, PlayerAlignment } = require('../data/enums')

jest.mock('../io/IOManager')

game = new TestGame()

test('instantiate player 0', () => {
    game.addPlayer('0')
    expect(game.players.get('0').username).toBe('0')
})

test('instantiate player 1', () => {
    game.addPlayer('1')
    expect(game.players.get('1').username).toBe('1')
})

test('instantiate player 2', () => {
    game.addPlayer('2', 'PLACEHOLDER_GODFATHER')
    expect(game.players.get('2').username).toBe('2')
})

test('start game', () => {
    game.startGame()
    expect(game.i.gameStatus).toBe(3)
})

test('not enough votes for day 1', () => {
    game.i.registerVote('0', '2')
    game.i.registerVote('1', '2')
    game.nextPhase()
    expect(game.i.gameStatus).toBe(3)
})

test('0, 1 axe 2, town wins', () => {
    game.nextPhase()
    game.i.registerVote('0', '2')
    game.i.registerVote('1', '2')
    expect(game.i.gameStatus).toBe(4)
    expect(IOManager.globalEmit.mock.calls.at(-1)[1]).toStrictEqual({endState: 'TOWN VICTORY'})
})
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

test('phase change', () => {
    const pair = []
    pair[0] = game.i.phaseType
    game.nextPhase()
    pair[1] = game.i.phaseType
    expect(pair).toStrictEqual([1, 2])
})

test('1 protects 0', () => {
    game.players.get('1').getAbility(game.players.get('1').activeAbilityIdList[0]).use(['0'])
    game.players.get('2').getAbility(game.players.get('2').activeAbilityIdList[0]).use(['0'])
    game.nextPhase()
    expect(game.i.isAlive('0')).toBe(true)
})

test('2 kills 0', () => {
    game.nextPhase()
    game.players.get('2').getAbility(game.players.get('2').activeAbilityIdList[0]).use(['0'])
    game.nextPhase()
    expect(game.i.isAlive('0')).toBe(false)
})


test('2 kills 1, game over, mafia wins', () => {
    game.nextPhase()
    game.players.get('2').getAbility(game.players.get('2').activeAbilityIdList[0]).use(['1'])
    game.nextPhase()
    expect(game.i.gameStatus).toBe(4)
    expect(IOManager.globalEmit.mock.calls.at(-1)[1]).toStrictEqual({endState: 'MAFIA VICTORY'})
})
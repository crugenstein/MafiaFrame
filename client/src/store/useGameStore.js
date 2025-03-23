import { create } from 'zustand'

export const GameStatus = Object.freeze({
    LOBBY_WAITING: 0,
    LOBBY_COUNTDOWN: 1,
    ROLLOVER: 2,
    IN_PROGRESS: 3,
    GAME_FINISHED: 4
})

export const PhaseType = Object.freeze({
    LOBBY: 0,
    DAY: 1,
    NIGHT: 2
})

export const useGameStore = create((set, get) => ({
    socket: null,

    gamePhaseType: PhaseType.LOBBY,

    initSocket: (socket) => {
        set({ socket })
        
        socket.on('PHASE_TYPE_UPDATE', ({ phaseType }) => {
            set({ gamePhaseType: phaseType })
        })
    },

    emit: (event, payload) => {
        const socket = get().socket
        if (socket) {
            socket.emit(event, payload)
        } else {
            console.log('Socket not connected.')
        }
    },

    disconnectSocket: () => {
        const socket = get().socket
        if (socket) {
            socket.disconnect()
            set({ socket: null })
            console.log('Socket disconnected.')
        }
    }

}))

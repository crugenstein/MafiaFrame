import { create } from 'zustand'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:5000' // replace this with a dynamic address later

export const PlayerStatus = Object.freeze({
    SPECTATOR: 0,
    ALIVE: 1,
    DEAD: 2
})

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
    username: null,
    admin: false,

    sharedChats: new Map(),
    lobbyChat: null,
    allPlayerData: new Map(),
    playerList: [],

    gamePhaseType: PhaseType.LOBBY,
    gameStatusType: GameStatus.LOBBY_WAITING,
    gamePhaseNumber: 0,
    gamePhaseTimeLeft: 1000,

    initSocket: () => {
        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket"]
        })

        set({ socket })
        
        socket.on('PHASE_TYPE_UPDATE', ({ phaseType }) => {
            set({ gamePhaseType: phaseType })
        })

        socket.on('GAME_STATUS_UPDATE', ({ gameStatus }) => {
            set({ gameStatusType: gameStatus })
        })

        socket.on('PHASE_NUMBER_UPDATE', ({ phaseNumber }) => {
            set({ gamePhaseNumber: phaseNumber })
        })

        socket.on('PHASE_TIME_LEFT_UPDATE', ({ phaseTimeLeft }) => {
            set({ gamePhaseTimeLeft: phaseTimeLeft })
        })

        socket.on('NEW_CHAT_READ_ACCESS', ({ chatId, name, messages }) => {
            set((state) => {
                const newChats = new Map(state.sharedChats)
                newChats.set(chatId, { name, messages, canWrite: false, canRead: true })
                return { sharedChats: newChats }
            })
        })

        socket.on('NEW_MESSAGE', ({ message, receiver }) => {
            set((state) => {
                const newChats = new Map(state.sharedChats)
                const chat = newChats.get(receiver)
                const oldMessages = chat.messages || []
                chat.messages = [...oldMessages, message]
                return { sharedChats: newChats }
            })
        })

        socket.on('NEW_CHAT_WRITE_ACCESS', ({ chatId }) => {
            set((state) => {
                const newChats = new Map(state.sharedChats)
                const chat = newChats.get(chatId)
                chat.canWrite = true
                return { sharedChats: newChats }
            })
        })

        socket.on('LOST_CHAT_WRITE_ACCESS', ({ chatId }) => {
            set((state) => {
                const newChats = new Map(state.sharedChats)
                const chat = newChats.get(chatId)
                chat.canWrite = false
                return { sharedChats: newChats }
            })
        })

        socket.on('LOST_CHAT_READ_ACCESS', ({ chatId }) => {
            set((state) => {
                const newChats = new Map(state.sharedChats)
                const chat = newChats.get(chatId)
                chat.canRead = false
                return { sharedChats: newChats }
            })
        })

        socket.on('PLAYER_JOIN', ({ playerData }) => {
            set((state) => {
                const newPlayerData = new Map(state.allPlayerData)
                newPlayerData.set(playerData.username, { 
                    admin: playerData.admin, 
                    visibleAlignment: 'UNKNOWN', 
                    status: PlayerStatus.SPECTATOR
                }) // todo add more stuff?
                const newPlayerList = [...state.playerList, { username: playerData.username, admin: playerData.admin }]
                return { allPlayerData: newPlayerData, playerList: newPlayerList }
            })
        })

        socket.on('RECEIVE_PLAYER_LIST', ({ playerList }) => {
            set((state) => {
                const newPlayerData = new Map(state.allPlayerData)
                const newPlayerList = []
                playerList.forEach(({username, visibleAlignment, admin, status}) => {
                    newPlayerData.set(username, {visibleAlignment, admin, status})
                    newPlayerList.push({username, admin})
                })
                return { allPlayerData: newPlayerData, playerList: newPlayerList }
            })
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
    },

    setUsername: (newName) => {
        set({ username: newName })
    },

    setLobbyChat: (chatId) => {
        set({ lobbyChat: chatId })
    },

    setAdmin: (val) => {
        set({ admin: val })
    }

}))

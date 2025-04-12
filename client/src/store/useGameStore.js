import { create } from 'zustand'
import { io } from 'socket.io-client'

export const PlayerAlignment = Object.freeze({
    TOWN: 0,
    MAFIA: 1,
    NEUTRAL: 2
})

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

export const AbilityTag = Object.freeze({
    DAY: 0, // use only during day
    NIGHT: 1, // use only during night
    DESIGNATED: 2, // need DA status to use it
    ASTRAL: 3 // does not visit
})

export const useGameStore = create((set, get) => ({
    socket: null,
    username: null,
    admin: false,
    role: null,
    playerAlignment: null,
    victory: null,
    alive: true,

    isDesignatedAttacker: false,

    sharedChats: new Map(),
    lobbyChat: null,
    allPlayerData: new Map(),
    playerList: [],
    abilities: [],
    notifications: [],
    whispers: 3,
    abilitySlots: 1,

    currentDPId: null,

    gamePhaseType: PhaseType.LOBBY,
    gameStatusType: GameStatus.LOBBY_WAITING,
    gamePhaseNumber: 0,
    gamePhaseTimeLeft: 1000,

    initSocket: async (serverURL) => {
        return new Promise((resolve, reject) => {
            
            const socket = io(serverURL, {
                withCredentials: true,
                transports: ["websocket"],
                reconnection: false
            })

            const timeout = setTimeout(() => {
                socket.disconnect()
                reject(new Error('Connection timed out.'))
            }, 5000)
          
            socket.on('connect_error', (err) => {
                clearTimeout(timeout);
                reject(new Error('Failed to connect to server.'))
            })

            socket.on('ACK_FROM_SERVER', ({ connectionMessage }) => {
                clearTimeout(timeout)
                console.log(connectionMessage)
                set({socket})

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
                        const newPlayerData = new Map()
                        const newPlayerList = []
                        playerList.forEach(({username, visibleAlignment, visibleRole, admin, status}) => {
                            newPlayerData.set(username, {visibleAlignment, visibleRole, admin, status})
                            newPlayerList.push({username, admin})
                        })
                        return { allPlayerData: newPlayerData, playerList: newPlayerList }
                    })
                })
        
                socket.on('RECEIVE_NOTIF', (notif) => {
                    set((state) => {
                        const newNotifs = [...state.notifications, notif]
                        return { notifications: newNotifs }
                    })
                })
        
                socket.on('ABILITY_USAGE_UPDATE', ({abilityId, newCount}) => {
                    set((state) => {
                        const newAbilities = [...state.abilities]
                        if (newCount === Infinity) {newCount = 'Infinity'}
                        newAbilities.find(ability => ability.id === abilityId).usages = newCount
                        return { abilities: newAbilities }
                    })
                })
        
                socket.on('WHISPER_COUNT_UPDATE', ({ whisperCount }) => {
                    set((state) => {
                        return { whispers: whisperCount }
                    })
                })
        
                socket.on('ABILITY_SLOT_COUNT_UPDATE', ({ abilitySlotCount }) => {
                    set((state) => {
                        return { abilitySlots: abilitySlotCount }
                    })
                })
        
                socket.on('DA_UPDATE', ({ DA }) => {
                    set((state) => {
                        if (state.username === DA) return { isDesignatedAttacker: true }
                        else return { isDesignatedAttacker: false }
                    })
                })
        
                socket.on('PLAYER_DIED', ({ death, role, alignment }) => {
                    set((state) => {
                        const newPlayerData = new Map(state.allPlayerData)
                        const oldData = newPlayerData.get(death)
                    
                        const updatedData = {
                            ...oldData,
                            status: PlayerStatus.DEAD,
                            visibleAlignment: alignment,
                            visibleRole: role,
                        }
                    
                        newPlayerData.set(death, updatedData)
                        if (death === state.username) {
                            return {allPlayerData: newPlayerData, alive: false}
                        } else {
                            return { allPlayerData: newPlayerData }
                        }
                    })
                })
        
                socket.on('CLIENT_GAME_STATE_UPDATE', ({ abilityData, chatData, playerData, roleName, alignment, currentDP }) => {
                    set((state) => {
                        const newAbilityData = abilityData
                        const newPlayerData = new Map()
                        const newPlayerList = []
                        playerData.forEach(({username, visibleAlignment, visibleRole, admin, status}) => {
                            newPlayerData.set(username, {visibleAlignment, visibleRole, admin, status})
                            newPlayerList.push({username, admin})
                        })
                        return { allPlayerData: newPlayerData, abilities: newAbilityData, role: roleName, playerAlignment: alignment, currentDPId: currentDP }
                    })
                })
        
                socket.on('GAME_END', ({ endState }) => {
                    set((state) => {
                        return { victory: endState }
                    })
                })

                resolve(socket)
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
        if (socket && socket.connected) {
            socket.removeAllListeners()
            socket.disconnect()
        }
        set({ socket: null })
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

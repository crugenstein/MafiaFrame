import { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from './SocketContext'

const GameContext = createContext(null)

export const useGame = () => {
    return useContext(GameContext)
}

export const GameProvider = ({ children }) => {


}
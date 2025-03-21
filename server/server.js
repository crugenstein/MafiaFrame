const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const cors = require('cors')
const { GameManager } = require('./utils/GameManager')
const { IOManager } = require('./io/IOManager')
const { registerEvents } = require('./io/SocketEvents')

const app = express()
const server = http.createServer(app)
const io = socketIO(server, { 
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})
const port = 5000

// CORS SLOP
app.use(cors())
app.use(express.json())

// ON SERVER STARTUP
IOManager.io = io

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`)

  registerEvents(socket)

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

GameManager.startGameLoop()

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const cors = require('cors')
const { GameManager } = require('./utils/GameManager')
const { IOManager } = require('./io/IOManager')
const { registerEvents } = require('./io/SocketEvents')
const { registerRequests } = require('./io/SocketRequests')

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
const instance = GameManager.getInstance()

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`)
  socket.emit('ACK_FROM_SERVER', { connectionMessage: 'Connected to MafiaFrame server successfully!'})

  registerEvents(socket, instance)
  registerRequests(socket, instance)

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    // DO ACTUAL DISCONNECT LOGIC LATER
  })
})

instance.startGameLoop()

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

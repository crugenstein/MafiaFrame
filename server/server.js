const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)
const io = socketIO(server, { 
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

// CORS SLOP
app.use(cors())
app.use(express.json())

var connectedPlayers = {}

// ON SOCKET CONNECTION
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('player_enter_lobby', ({ username }) => { // CLIENT TOLD SERVER "I JOINED THE LOBBY AND SUBMITTED A USERNAME!!!"
    connectedPlayers[socket.id] = username
    io.emit('clientside_player_enter_lobby', { username })
  })

  socket.on('send_pregame_message', ({ message, username }) => { // CLIENT TOLD SERVER "I WANT TO SEND A MESSAGE TO OTHER LOBBY PEOPLE BEFORE GAME STARTS"
    io.emit('receive_pregame_message', { message, username });
  });

  socket.on('disconnect', () => { // CLIENT TOLD SERVER "GOODBYE"!!!
    if (connectedPlayers[socket.id]) {
      const username = connectedPlayers[socket.id];
      delete connectedPlayers[socket.id];
      socket.broadcast.emit('clientside_player_left_lobby', { username });
    }
  });
});

app.get('/lobbyPlayers', (req, res) => { // fetch connected player list
  const players = Object.values(connectedPlayers)
  res.json(players)
})

server.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});

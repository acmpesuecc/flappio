const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const db_url = "mongodb+srv://manavdewangan2017_db_user:O1VDUX2VHorkMIyh@cluster0.aads45s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.use(express.text());
app.use(cors());

let client = new MongoClient(db_url);

// Game rooms storage
const rooms = new Map();

// Room class to manage game state
class GameRoom {
    constructor(roomId, maxPlayers) {
        this.roomId = roomId;
        this.maxPlayers = maxPlayers;
        this.players = new Map();
        this.gameStarted = false;
        this.gameStartTime = null;
        this.rods = [];
        this.rodSpawnInterval = null;
        this.host = null;
    }

    addPlayer(socketId, playerName) {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }
        
        this.players.set(socketId, {
            id: socketId,
            name: playerName,
            score: 0,
            position: [0.13, 0.40],
            velocity: [0, -0.026],
            alive: true,
            ready: false
        });

        if (!this.host) {
            this.host = socketId;
        }

        return true;
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        if (this.host === socketId && this.players.size > 0) {
            this.host = this.players.keys().next().value;
        }
        
        if (this.players.size === 0) {
            this.stopGame();
        }
    }

    setPlayerReady(socketId, ready) {
        const player = this.players.get(socketId);
        if (player) {
            player.ready = ready;
        }
    }

    allPlayersReady() {
        if (this.players.size === 0) return false;
        for (let player of this.players.values()) {
            if (!player.ready) return false;
        }
        return true;
    }

    startGame() {
        if (this.gameStarted) return;
        
        this.gameStarted = true;
        this.gameStartTime = Date.now();
        
        // Reset all players
        for (let player of this.players.values()) {
            player.score = 0;
            player.position = [0.13, 0.40];
            player.velocity = [0, -0.026];
            player.alive = true;
        }

        // Start spawning rods
        this.spawnRod();
        this.rodSpawnInterval = setInterval(() => {
            this.spawnRod();
        }, 1500);
    }

    spawnRod() {
        const rodY = Math.random() * (0.63 - 0.25) + 0.25;
        const rod = {
            id: Date.now() + Math.random(),
            x: 1.0,
            y: rodY,
            scored: new Set()
        };
        this.rods.push(rod);
    }

    stopGame() {
        this.gameStarted = false;
        if (this.rodSpawnInterval) {
            clearInterval(this.rodSpawnInterval);
            this.rodSpawnInterval = null;
        }
        this.rods = [];
    }

    updatePlayer(socketId, data) {
        const player = this.players.get(socketId);
        if (player && player.alive) {
            if (data.position) player.position = data.position;
            if (data.velocity) player.velocity = data.velocity;
            if (data.score !== undefined) player.score = data.score;
            if (data.alive !== undefined) player.alive = data.alive;
        }
    }

    getGameState() {
        const playersArray = Array.from(this.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            score: p.score,
            position: p.position,
            alive: p.alive,
            ready: p.ready
        }));

        return {
            roomId: this.roomId,
            players: playersArray,
            gameStarted: this.gameStarted,
            rods: this.rods,
            host: this.host,
            maxPlayers: this.maxPlayers
        };
    }
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Create room
    socket.on('createRoom', ({ playerName, maxPlayers }) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new GameRoom(roomId, maxPlayers || 4);
        
        if (room.addPlayer(socket.id, playerName)) {
            rooms.set(roomId, room);
            socket.join(roomId);
            socket.emit('roomCreated', { roomId, gameState: room.getGameState() });
            console.log(`Room ${roomId} created by ${playerName}`);
        }
    });

    // Join room
    socket.on('joinRoom', ({ roomId, playerName }) => {
        const room = rooms.get(roomId);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        if (room.gameStarted) {
            socket.emit('error', { message: 'Game already in progress' });
            return;
        }

        if (room.addPlayer(socket.id, playerName)) {
            socket.join(roomId);
            socket.emit('roomJoined', { roomId, gameState: room.getGameState() });
            io.to(roomId).emit('playerJoined', { gameState: room.getGameState() });
            console.log(`${playerName} joined room ${roomId}`);
        } else {
            socket.emit('error', { message: 'Room is full' });
        }
    });

    // List available rooms
    socket.on('listRooms', () => {
        const availableRooms = [];
        for (let [roomId, room] of rooms.entries()) {
            if (!room.gameStarted && room.players.size < room.maxPlayers) {
                availableRooms.push({
                    roomId,
                    players: room.players.size,
                    maxPlayers: room.maxPlayers
                });
            }
        }
        socket.emit('roomsList', availableRooms);
    });

    // Player ready
    socket.on('playerReady', ({ roomId, ready }) => {
        const room = rooms.get(roomId);
        if (room) {
            room.setPlayerReady(socket.id, ready);
            io.to(roomId).emit('gameStateUpdate', room.getGameState());
            
            if (room.allPlayersReady() && room.players.size > 0) {
                room.startGame();
                io.to(roomId).emit('gameStart', { 
                    startTime: room.gameStartTime,
                    gameState: room.getGameState() 
                });
            }
        }
    });

    // Start game (host only)
    socket.on('startGame', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room && room.host === socket.id) {
            room.startGame();
            io.to(roomId).emit('gameStart', { 
                startTime: room.gameStartTime,
                gameState: room.getGameState() 
            });
        }
    });

    // Player update
    socket.on('playerUpdate', ({ roomId, position, velocity, score, alive }) => {
        const room = rooms.get(roomId);
        if (room && room.gameStarted) {
            room.updatePlayer(socket.id, { position, velocity, score, alive });
            socket.to(roomId).emit('gameStateUpdate', room.getGameState());
        }
    });

    // Player jump
    socket.on('playerJump', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room && room.gameStarted) {
            socket.to(roomId).emit('playerJumped', { playerId: socket.id });
        }
    });

    // Player died
    socket.on('playerDied', ({ roomId, finalScore }) => {
        const room = rooms.get(roomId);
        if (room) {
            const player = room.players.get(socket.id);
            if (player) {
                player.alive = false;
                player.score = finalScore;
            }
            
            io.to(roomId).emit('playerDied', { 
                playerId: socket.id,
                gameState: room.getGameState() 
            });

            // Check if all players are dead
            const alivePlayers = Array.from(room.players.values()).filter(p => p.alive);
            if (alivePlayers.length === 0) {
                room.stopGame();
                io.to(roomId).emit('gameOver', { 
                    finalScores: room.getGameState() 
                });
            }
        }
    });

    // Leave room
    socket.on('leaveRoom', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room) {
            room.removePlayer(socket.id);
            socket.leave(roomId);
            io.to(roomId).emit('playerLeft', { 
                playerId: socket.id,
                gameState: room.getGameState() 
            });
            
            if (room.players.size === 0) {
                rooms.delete(roomId);
                console.log(`Room ${roomId} deleted`);
            }
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Remove player from all rooms
        for (let [roomId, room] of rooms.entries()) {
            if (room.players.has(socket.id)) {
                room.removePlayer(socket.id);
                io.to(roomId).emit('playerLeft', { 
                    playerId: socket.id,
                    gameState: room.getGameState() 
                });
                
                if (room.players.size === 0) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} deleted`);
                }
            }
        }
    });
});

// Database connection and HTTP routes
async function dbConnect() {
    try {
        await client.connect();
        var dbo = client.db('flappio');
        var leaderboard = dbo.collection("leaderboard");

        scores_get = async function () {
            console.log("Retrieving Leaderboard");
            return await (await leaderboard.find(
                {},
                { sort: { score: -1 }, projection: { _id: 0, IP: 1, score: 1 } }
            )).toArray();
        };

        scores_update = async function (IP, score) {
            let record = await leaderboard.find({ IP: IP }).toArray();
            if (record.length && score < record[0].score) {
                return;
            }
            await leaderboard.updateOne(
                { IP: IP },
                { $set: { score: score } },
                { upsert: true }
            );
        };

        console.log("Database is connected!");

        app.get('/leaderboard', async (req, res) => {
            const scores = await scores_get();
            res.status(200).send(JSON.stringify(scores));
        });

        app.post('/leaderboard', async (req, res) => {
            let ip = req.headers['origin'];
            await scores_update(ip, Number(req.body));
            res.status(200).send(`Score updated for ${ip}`);
        });

        app.get('/', (req, res) => {
            res.send("Multiplayer Flappy Bird Server Running");
        });

        server.listen(3001, '0.0.0.0', () => {
            console.log("Multiplayer Server is Up on port 3001!");
        });
    } catch (e) {
        console.log("Error connecting to database: ", e);
    }
}

dbConnect();

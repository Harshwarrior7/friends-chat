const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve your index.html and any CSS/JS files in the folder
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    // 1. Handle User Joining (triggered after the modal animation)
    socket.on('user joined', (username) => {
        console.log(`User Logged In: ${username}`);
        // Broadcast to everyone ELSE that a new friend is here
        socket.broadcast.emit('user status', `${username} joined the room ✨`);
    });

    // 2. Handle Messages
    socket.on('chat message', (data) => {
        // data contains { user: "Name", text: "Hello" }
        // io.emit sends it to EVERYONE, including the sender
        io.emit('chat message', data);
    });

    socket.on('disconnect', () => {
        console.log('A user left the chat');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 Chat Server running at http://localhost:${PORT}`);
});

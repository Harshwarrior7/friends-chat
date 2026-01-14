const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// Track online users for the "Online" badge in your header
let onlineUsers = new Set();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    let connectedUser = "";

    // 1. Handle User Joining
    socket.on('user joined', (username) => {
        connectedUser = username;
        onlineUsers.add(username);
        
        console.log(`User Logged In: ${username}`);
        
        // Update everyone on the new online count
        io.emit('update online count', onlineUsers.size);
        
        // Notify others with the sparkle animation text
        socket.broadcast.emit('user status', `${username} joined the room ✨`);
    });

    // 2. Handle Messages
    socket.on('chat message', (data) => {
        // We broadcast to EVERYONE including the sender
        io.emit('chat message', {
            user: data.user,
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    // 3. Handle Disconnect
    socket.on('disconnect', () => {
        if (connectedUser) {
            onlineUsers.delete(connectedUser);
            io.emit('update online count', onlineUsers.size);
            socket.broadcast.emit('user status', `${connectedUser} left the chat 🚪`);
            console.log(`${connectedUser} disconnected`);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 Animated Chat Server running at http://localhost:${PORT}`);
});

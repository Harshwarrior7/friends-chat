const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    maxHttpBufferSize: 1e8 // 100MB limit for image and video uploads
});

app.use(express.static(__dirname));

let onlineUsers = new Set();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    let connectedUser = "";

    // --- 1. User Join Logic ---
    socket.on('user joined', (username) => {
        connectedUser = username;
        onlineUsers.add(username);
        io.emit('update online count', onlineUsers.size);
        socket.broadcast.emit('user status', `${username} joined ✨`);
    });

    // --- 2. Typing Indicator Logic ---
    socket.on('typing', (username) => {
        socket.broadcast.emit('user typing', username);
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('user stop typing');
    });

    // --- 3. Chat Message Logic (Text + Files + Replies) ---
    socket.on('chat message', (data) => {
        const msgId = Date.now() + Math.random().toString(36).substr(2, 9);
        io.emit('chat message', {
            id: msgId,
            user: data.user,
            text: data.text,
            file: data.file,         // Base64 string for images/videos
            fileType: data.fileType, // 'image' or 'video'
            replyTo: data.replyTo    // Contains {id, user, text}
        });
    });

    // --- 4. Edit Message Logic ---
    socket.on('edit message', (data) => {
        // data contains {id, text}
        io.emit('message edited', data);
    });

    // --- 5. Delete Message Logic ---
    socket.on('delete message', (id) => {
        io.emit('message deleted', id);
    });

    // --- 6. Disconnect Logic ---
    socket.on('disconnect', () => {
        if (connectedUser) {
            onlineUsers.delete(connectedUser);
            io.emit('update online count', onlineUsers.size);
            socket.broadcast.emit('user status', `${connectedUser} left 🚪`);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 Animated Chat Server running at http://localhost:${PORT}`);
});

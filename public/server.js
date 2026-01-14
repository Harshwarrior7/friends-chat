const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let onlineUsers = new Set();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    let connectedUser = "";

    socket.on('user joined', (username) => {
        connectedUser = username;
        onlineUsers.add(username);
        io.emit('update online count', onlineUsers.size);
        socket.broadcast.emit('user status', `${username} joined ✨`);
    });

    // Handle New Message
    socket.on('chat message', (data) => {
        const msgId = Date.now() + Math.random().toString(36).substr(2, 9);
        io.emit('chat message', {
            id: msgId,
            user: data.user,
            text: data.text,
            replyTo: data.replyTo // Contains {id, user, text}
        });
    });

    // Handle Edit
    socket.on('edit message', (data) => {
        io.emit('message edited', data); // sends {id, text}
    });

    // Handle Delete
    socket.on('delete message', (id) => {
        io.emit('message deleted', id);
    });

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
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

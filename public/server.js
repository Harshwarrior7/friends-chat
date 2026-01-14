const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let messages = [];

io.on('connection', (socket) => {
    
    // Triggered when a user clicks "Join Chat"
    socket.on('user joined', (username) => {
        socket.broadcast.emit('user status', `${username} joined the room`);
    });

    socket.on('chat message', (data) => {
        const msgObject = { 
            id: Date.now() + Math.random().toString(36).substr(2, 5), 
            user: data.user, 
            text: data.text,
            replyTo: data.replyTo 
        };
        messages.push(msgObject);
        io.emit('chat message', msgObject);
    });

    socket.on('typing', (user) => socket.broadcast.emit('display typing', user));
    socket.on('stop typing', () => socket.broadcast.emit('hide typing'));

    socket.on('edit message', (data) => {
        const msg = messages.find(m => m.id === data.id);
        if (msg) {
            msg.text = data.newText;
            io.emit('message edited', { id: data.id, text: data.newText });
        }
    });

    socket.on('delete message', (id) => {
        messages = messages.filter(m => m.id !== id);
        io.emit('message deleted', id);
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('hide typing');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server live on port ${PORT}`));

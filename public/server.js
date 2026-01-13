const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve files from the current directory (index.html, etc.)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Temporary memory for messages (clears on server restart)
let messages = [];

io.on('connection', (socket) => {
    console.log('A user connected');

    // 1. Sending Messages
    socket.on('chat message', (data) => {
        const msgObject = { 
            id: Date.now() + Math.random().toString(36).substr(2, 9), 
            user: data.user, 
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        messages.push(msgObject);
        io.emit('chat message', msgObject);
    });

    // 2. Typing Indicator (Broadcast to others only)
    socket.on('typing', (username) => {
        socket.broadcast.emit('display typing', username);
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('hide typing');
    });

    // 3. Message Editing
    socket.on('edit message', (data) => {
        const msgIndex = messages.findIndex(m => m.id === data.id);
        if (msgIndex !== -1) {
            messages[msgIndex].text = data.newText;
            messages[msgIndex].edited = true;
            // Tell everyone to update this specific message ID
            io.emit('message edited', { id: data.id, text: data.newText });
        }
    });

    // 4. Message Deletion
    socket.on('delete message', (id) => {
        messages = messages.filter(m => m.id !== id);
        io.emit('message deleted', id);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Ensure typing indicator hides if someone leaves while typing
        socket.broadcast.emit('hide typing');
    });
});

// Port handling for Render or Localhost
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve files from the current directory
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Store messages in memory (temporary - will clear on server restart)
let messages = [];

io.on('connection', (socket) => {
    console.log('A user connected');

    // 1. Handle sending a new message
    socket.on('chat message', (data) => {
        // Create a message object with a unique ID
        const newMessage = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            user: data.user,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        messages.push(newMessage);
        io.emit('chat message', newMessage);
    });

    // 2. Handle editing a message
    socket.on('edit message', (data) => {
        // Find the message by ID and update its text
        const msgIndex = messages.findIndex(m => m.id === data.id);
        if (msgIndex !== -1) {
            messages[msgIndex].text = data.newText;
            messages[msgIndex].edited = true;
            io.emit('message edited', messages[msgIndex]);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

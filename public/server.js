const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Put this here, right after app is created
app.use(express.static(__dirname + '/public'));

// Your socket code
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start server
http.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

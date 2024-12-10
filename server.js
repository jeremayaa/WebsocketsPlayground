require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const socketIo = require('socket.io');
const { SocketHandler } = require('./public/SocketHandler.js'); // Import the class

const app = express();

// Stwórz server HTTPS. Bezpiszne połączenie jest niezbędne aby przesyłać dane o z sensorów telefonu przez Websocket
const options = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT),
};

const server = https.createServer(options, app);
const io = socketIo(server);
const PORT = 3000;

// res.setHeader('Permissions-Policy', 'magnetometer=*');
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'magnetometer=*'); // Adjust policy based on your needs
    next();
});

// Obsłóż pliki statyczne
app.use(express.static(path.join(__dirname, 'public')));

// Inicjalizuj socket handler
const socketHandler = new SocketHandler(io);
socketHandler.handleConnections();

// Otwórz serwer
server.listen(PORT, () => {
    console.log(`HTTPS Server is running on https://localhost:${PORT}`);
});


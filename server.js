require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const socketIo = require('socket.io');
const app = express();

// Stwórz server HTTPS. Bezpiszne połączenie jest niezbędne aby przesyłać dane o z sensorów telefonu przez Websocket
const options = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT),
};

const server = https.createServer(options, app);
const io = socketIo(server);
const PORT = 3000;

// Obsłóż pliki statyczne
app.use(express.static(path.join(__dirname, 'public')));


class SocketHandler {
    constructor(io) {
        this.io = io;
        this.clients = {};
    }

    handleConnections() {
        this.io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);

            // Mapuje socket.id z userID
            socket.on('setUserID', (userID) => {
                this.clients[userID] = socket.id;
                console.log('User ID set for socket', socket.id, ':', userID);
            });

            // Tworzy pokój za pomocą jego nazwy i hosta oraz wysyła zaproszenie na wszystkie urządzenia
            socket.on('CreateRoom', (data) => {
                const {RoomName, userID} = data;
                room = new Room(RoomName, userID);
                console.log('Utworzono pokój o nazwie:', RoomName);
                console.log(room);

                this.io.emit('Invitation', RoomName);

                // w ten sposób będę mógł wysyłać wiadomośći do pojedynczych użytkowników
                // this.io.to(this.clients['Andro']).emit('Invitation', RoomName);

            });

            socket.on('StartMeasurementOnPhone', (data) => {
                const { userID } = data;
                const phoneSocketId = this.clients[userID];
            
                if (phoneSocketId) {
                    console.log(`Requesting phone (${userID}) to start capturing sensor data`);
                    this.io.to(phoneSocketId).emit('StartCapturingSensorData');
                } else {
                    console.log(`Phone with userID ${userID} is not connected`);
                }
            });

            socket.on('StopMeasurementOnPhone', (data) => {
                const { userID } = data;
                const phoneSocketId = this.clients[userID];
                this.io.to(phoneSocketId).emit('StopCapturingSensorData');
                console.log(`Data measurment on (${userID}) stopped`);
            })

            // Aktualizuj listę użytkowników w pokoju
            socket.on('joinRoom', (data) => {
                const {RoomName, userID} = data;
                console.log('użytkownik', userID, 'dołączył do pokoju: ', RoomName);
                room.sensors.push(userID);
                console.log(`wszyscy w serwerze to ${room.sensors}`);
                this.io.emit('SendInfoAboutJoining', (data));
            });

            socket.on('getSensors', () => {
                // console.log(room.getSensors());
                socket.emit('giveSensors', (room.getSensors()));
            })


            socket.on('sensorData', (data) => {
                console.log('sensorData');
                this.io.emit('ShowSensorData', (data));
            })

            // Usuń użytkownika z pokoju po rozłączeniu
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                const userID = Object.keys(this.clients).find(key => this.clients[key] === socket.id);
                    if (userID) {
                        delete this.clients[userID];
                    }
            });
        });
    }
}

// klasa pokój:

// Założenie: jeden komputer może wygenerować jeden pokój.
// Więcej nie jest potrzebne 
// Możnaby się obejść bez idei 'pokoju' ale chcę mieć informację o tym jakie urządzenia są przyłączone do sieci aby móc wysyłaś i odbierać
// informacje od każdego z nich oddzielnie
// Dodatkowo osoba która wejdzie na stronę 'przypadkiem' nie będzie mogła odbierać ani wysyłać informacji jeśli nie dołączyła do pokoju 
// co zwiększa prywatność i minimalizuje bugi

let room;

class Room {
    constructor(name, host) {
        this.name = name;
        this.host = host;
        this.sensors = [];
    }

    getSensors() {
        return this.sensors;
    }
}

// Inicjalizuj socket handler
const socketHandler = new SocketHandler(io);
socketHandler.handleConnections();

// Otwórz serwer
server.listen(PORT, () => {
    console.log(`HTTPS Server is running on https://localhost:${PORT}`);
});


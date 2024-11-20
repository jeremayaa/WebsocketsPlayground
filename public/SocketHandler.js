
// klasa pokój:

// Założenie: jeden komputer może wygenerować jeden pokój.
// Więcej nie jest potrzebne 
// Możnaby się obejść bez idei 'pokoju' ale chcę mieć informację o tym jakie urządzenia są przyłączone do sieci aby móc wysyłaś i odbierać
// informacje od każdego z nich oddzielnie
// Dodatkowo osoba która wejdzie na stronę 'przypadkiem' nie będzie mogła odbierać ani wysyłać informacji jeśli nie dołączyła do pokoju 
// co zwiększa prywatność i minimalizuje bugi

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

class SocketHandler {
    constructor(io) {
        this.io = io;
        this.clients = {};
        this.IsRoomActive = 0; 
        this.room = null;     
    }

    handleConnections() {
        this.io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);

            socket.on('setUserID', (userID) => {
                this.clients[userID] = socket.id;
                console.log('User ID set for socket', socket.id, ':', userID);

                if (this.IsRoomActive) {
                    this.io.to(socket.id).emit('Invitation', this.room.name);
                }
            });

            socket.on('CreateRoom', (data) => {
                const { RoomName, userID } = data;
                this.room = new Room(RoomName, userID);
                this.IsRoomActive = 1;
                console.log('Utworzono pokój o nazwie:', RoomName);
                console.log(this.room);

                this.io.emit('Invitation', RoomName);
            });

            socket.on('StartMeasurementOnPhone', (data) => {
                const { userID } = data;
                const phoneSocketId = this.clients[userID];

                if (phoneSocketId) {
                    console.log(`Requesting phone (${userID}) to start capturing sensor data`);
                    this.io.to(phoneSocketId).emit('StartCapturingSensorData', (userID));
                } else {
                    console.log(`Phone with userID ${userID} is not connected`);
                }
            });

            socket.on('StopMeasurementOnPhone', (data) => {
                const { userID } = data;
                const phoneSocketId = this.clients[userID];
                this.io.to(phoneSocketId).emit('StopCapturingSensorData');
                console.log(`Data measurement on (${userID}) stopped`);
            });

            socket.on('joinRoom', (data) => {
                const { RoomName, userID } = data;
                console.log('użytkownik', userID, 'dołączył do pokoju: ', RoomName);
                this.room.sensors.push(userID);
                console.log(`wszyscy w serwerze to ${this.room.sensors}`);
                this.io.emit('SendInfoAboutJoining', data);
            });

            socket.on('getSensors', () => {
                socket.emit('giveSensors', this.room.getSensors());
            });

            socket.on('sensorData', (data) => {
                this.io.emit('ShowSensorData', data);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                const userID = Object.keys(this.clients).find(key => this.clients[key] === socket.id);
                if (userID) {
                    delete this.clients[userID];
                    this.io.emit('SendInfoAboutDisconnection', userID);
                }
            });
        });
    }
}

module.exports = { SocketHandler, Room };
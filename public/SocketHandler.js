class SocketHandler {
    constructor(io) {
        this.io = io;
        this.clients = {};
    }

    handleConnections() {
        this.io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);

            socket.on('setUserID', ({userID, isMobile}) => {
                
                this.clients[userID] = socket.id;
                console.log('User ID set for socket', socket.id, ':', userID);
                if (isMobile) {
                    this.io.to(socket.id).emit('getAvailableSensors', userID);
                }
            });

            socket.on('AvailableSensors', ({AvailableSensors, userID}) => {

                console.log(`availbleSensors for ${userID}}:
                        Accelerometer: ${AvailableSensors['Accelerometer']},
                        Gyroscope: ${AvailableSensors['Gyroscope']},
                        Magnetometer: ${AvailableSensors['Magnetometer']},
                        OrientationEvent: ${AvailableSensors['OrientationEvent']},
                        MotionEvent: ${AvailableSensors['MotionEvent']}

                        `);
                        
                this.io.emit('AvailableSensors', { AvailableSensors, userID });
            })

            socket.on('StartMeasurementOnPhone', (data) => {
                const { userID, delay, WhichSensors } = data;
                const phoneSocketId = this.clients[userID];

                if (phoneSocketId) {
                    console.log(`Requesting phone (${userID}) to start capturing sensor data`);

                    this.io.to(phoneSocketId).emit('initializeSensors', WhichSensors);
                    this.io.to(phoneSocketId).emit('StartCapturingSensorData', data);
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

            socket.on('sensorData', (data) => {
                this.io.emit('sensorData', data);
            });

            socket.on('selectedDevices', (devices) => {
                this.io.emit('selectedDevices', devices);
            });

            socket.on('MagetometerError', () => {
                console.log('MagetometerError');
            });

            socket.on('GyroscopeError', () => {
                console.log('GyroscopeError');
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

module.exports = { SocketHandler };
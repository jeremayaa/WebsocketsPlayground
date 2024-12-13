export class SensorDataHandler {
    constructor(socket) {
        this.socket = socket;

        this.interval = null;
        this.baseTimestamp = null;

        this.initializeListeners();

        // this.deviceType = window.innerWidth > 600 ? 'computer' : 'phone';
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.deviceType = isMobile ? 'phone' : 'computer';

        // console.log('Device Type Detected:', this.deviceType);
        // if (this.deviceType === 'phone') {
        //     this.initializeSensors();
        // }
    }

    getAvailableSensors(userID) {
        let AvailableSensors = {
            'Accelerometer': 0,
            'Gyroscope': 0,
            'Magnetometer': 0,
            'OrientationEvent': 0,
            'MotionEvent': 0
        }

        if ('Accelerometer' in window) {
            AvailableSensors['Accelerometer'] = 1;
        }
        if ('Gyroscope' in window) {
            AvailableSensors['Gyroscope'] = 1;
        }
        if ('Magnetometer' in window) {
            AvailableSensors['Magnetometer'] = 1;
        }
        if (window.DeviceOrientationEvent) {
            AvailableSensors['OrientationEvent'] = 1;
        }
        if (window.DeviceMotionEvent) {
            AvailableSensors['MotionEvent'] = 1;
        }

        this.socket.emit('AvailableSensors', { AvailableSensors, userID });
        // return AvailableSensors
    }


    initializeListeners() {
        this.socket.on('getAvailableSensors', (userID) => {
            this.getAvailableSensors(userID);
        })  

        this.socket.on('initializeSensors', (WhichSensors) => {
            this.initializePhoneSensors(WhichSensors);
        })

        this.socket.on('StartCapturingSensorData', (data) => {
            this.startCapturing(data);
        });

        this.socket.on('StopCapturingSensorData', () => {
            this.stopCapturing();
        });
    }

    initializePhoneSensors(WhichSensors) {
        
        if (WhichSensors['Accelerometer']) {
            this.ax = 0;
            this.ay = 0;
            this.az = 0;
            // sprawdzam drugi raz czy napewno Accelerometer jest dostęny
            if ('Accelerometer' in window) {
                const accelerometerSensor = new Accelerometer({ frequency: 60 });
                accelerometerSensor.addEventListener('reading', () => {
                    this.ax = parseFloat(accelerometerSensor.x.toFixed(2));
                    this.ay = parseFloat(accelerometerSensor.y.toFixed(2));
                    this.az = parseFloat(accelerometerSensor.z.toFixed(2));
                });
                accelerometerSensor.addEventListener('error', (event) => {
                    console.error('Accelerometer Sensor Error:', event.error);
                });
                accelerometerSensor.start();
            } else {
                this.socket.emit('AccelerometerError');
            }
        }

        if (WhichSensors['Gyroscope']) {
            this.gx = 0;
            this.gy = 0;
            this.gz = 0;
            // sprawdzam drugi raz czy napewno żytoskop jest dostęny
            if ('Gyroscope' in window) {
                const gyroscopeSensor = new Gyroscope({ frequency: 60 });
                gyroscopeSensor.addEventListener('reading', () => {
                    this.gx = parseFloat(gyroscopeSensor.x.toFixed(2));
                    this.gy = parseFloat(gyroscopeSensor.y.toFixed(2));
                    this.gz = parseFloat(gyroscopeSensor.z.toFixed(2));
                });
                gyroscopeSensor.addEventListener('error', (event) => {
                    console.error('Gyroscope Sensor Error:', event.error);
                });
                gyroscopeSensor.start();
            } else {
                this.socket.emit('GyroscopeError');
            }
        }

        if (WhichSensors['Magnetometer']) {  
            this.mx = 0;
            this.my = 0;
            this.mz = 0;
            // sprawdzam drugi raz czy napewno Magnetometer jest dostęny
            if ('Magnetometer' in window) {
                const magnetometerSensor = new Magnetometer({ frequency: 60 });
                magnetometerSensor.addEventListener('reading', () => {
                    this.mx = parseFloat(magnetometerSensor.x.toFixed(2));
                    this.my = parseFloat(magnetometerSensor.y.toFixed(2));
                    this.mz = parseFloat(magnetometerSensor.z.toFixed(2));
                });
                magnetometerSensor.addEventListener('error', (event) => {
                    console.error('Magnetometer Sensor Error:', event.error);
                });
                magnetometerSensor.start();
            } else {
                this.socket.emit('MagetometerError');
            }
        }

        if (WhichSensors['DeviceMotion']) {
            this.dmx = 0;
            this.dmy = 0;
            this.dmz = 0;
            if (window.DeviceMotionEvent) {
                window.addEventListener('devicemotion', (event) => {
                    if (event.acceleration) {
                        this.dmx = parseFloat(event.acceleration.x.toFixed(2));
                        this.dmy = parseFloat(event.acceleration.y.toFixed(2));
                        this.dmz = parseFloat(event.acceleration.z.toFixed(2));
                    }
                });
            }
        }

        if (WhichSensors['DeviceOrientation']) {   
            this.dox = 0;
            this.doy = 0;
            this.doz = 0;
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', (event) => {
                    this.dox = parseFloat(event.alpha.toFixed(2));
                    this.doy = parseFloat(event.beta.toFixed(2));
                    this.doz = parseFloat(event.gamma.toFixed(2));
                });
            }
        }
    }


    startCapturing(data) {
        if (this.deviceType === 'phone') {
            this.interval = setInterval(() => this.sendData(data.userID), data.delay); // 30 times per second
        }
    }
    
    stopCapturing() {
        clearInterval(this.interval);
    }
    
    sendData(userID) {
        const currentTime = performance.now(); // High-resolution timestamp
        const elapsedTime = (currentTime - this.baseTimestamp).toFixed(0); // Time since start

        // Dynamically construct the data object
        const sensorData = {
            timestamp: parseFloat(elapsedTime),
            userid: userID
        };

        if (this.ax !== undefined && this.ay !== undefined && this.az !== undefined) {
            sensorData.ax = this.ax;
            sensorData.ay = this.ay;
            sensorData.az = this.az;
        }

        if (this.gx !== undefined && this.gy !== undefined && this.gz !== undefined) {
            sensorData.gx = this.gx;
            sensorData.gy = this.gy;
            sensorData.gz = this.gz;
        }

        if (this.mx !== undefined && this.my !== undefined && this.mz !== undefined) {
            sensorData.mx = this.mx;
            sensorData.my = this.my;
            sensorData.mz = this.mz;
        }

        if (this.dmx !== undefined && this.dmy !== undefined && this.dmz !== undefined) {
            sensorData.dmx = this.dmx;
            sensorData.dmy = this.dmy;
            sensorData.dmz = this.dmz;
        }

        if (this.dox !== undefined && this.doy !== undefined && this.doz !== undefined) {
            sensorData.dox = this.dox;
            sensorData.doy = this.doy;
            sensorData.doz = this.doz;
        }

        // Emit the sensor data
        this.socket.emit('sensorData', sensorData);
    }
}

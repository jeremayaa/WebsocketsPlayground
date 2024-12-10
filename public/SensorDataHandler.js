export class SensorDataHandler {
    constructor(socket) {
        this.socket = socket;
        this.alpha = 0;
        this.beta = 0;
        this.gamma = 0;
        this.accX = 0;
        this.accY = 0;
        this.accZ = 0;
        this.magX = 0;
        this.magY = 0;
        this.magZ = 0;
        this.interval = null;
        this.baseTimestamp = null;

        this.initializeListeners();

        // this.deviceType = window.innerWidth > 600 ? 'computer' : 'phone';
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.deviceType = isMobile ? 'phone' : 'computer';

        // console.log('Device Type Detected:', this.deviceType);
        if (this.deviceType === 'phone') {
            this.initializeRawSensors();
        }
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

        this.socket.on('StartCapturingSensorData', (data) => {
            this.startCapturing(data);
        });

        this.socket.on('StopCapturingSensorData', () => {
            this.stopCapturing();
        });
    }

    initializePhoneSensors() {
        console.log('initialise phone sensors');
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => {
                this.alpha = parseFloat(event.alpha.toFixed(2));
                this.beta = parseFloat(event.beta.toFixed(2));
                this.gamma = parseFloat(event.gamma.toFixed(2));
            });
        }

        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (event) => {
                if (event.acceleration) {
                    this.accX = parseFloat(event.acceleration.x.toFixed(2));
                    this.accY = parseFloat(event.acceleration.y.toFixed(2));
                    this.accZ = parseFloat(event.acceleration.z.toFixed(2));
                }
            });
        }
    }

    initializeRawSensors() {
        if ('Gyroscope' in window) {
            const gyroscopeSensor = new Gyroscope({ frequency: 60 });
            gyroscopeSensor.addEventListener('reading', () => {
                this.alpha = parseFloat(gyroscopeSensor.x.toFixed(2));
                this.beta = parseFloat(gyroscopeSensor.y.toFixed(2));
                this.gamma = parseFloat(gyroscopeSensor.z.toFixed(2));
            });
            gyroscopeSensor.addEventListener('error', (event) => {
                console.error('Gyroscope Sensor Error:', event.error);
            });
            gyroscopeSensor.start();
        } else {
            this.socket.emit('GyroscopeError');
        }

        if ('Accelerometer' in window) {
            const accelerometerSensor = new Accelerometer({ frequency: 60 });
            accelerometerSensor.addEventListener('reading', () => {
                this.alpha = parseFloat(accelerometerSensor.x.toFixed(2));
                this.beta = parseFloat(accelerometerSensor.y.toFixed(2));
                this.gamma = parseFloat(accelerometerSensor.z.toFixed(2));
            });
            accelerometerSensor.addEventListener('error', (event) => {
                console.error('Accelerometer Sensor Error:', event.error);
            });
            accelerometerSensor.start();
        } else {
            this.socket.emit('AccelerometerError');
        }
    
        // Check for Magnetometer support
        if ('Magnetometer' in window) {
            const magnetometerSensor = new Magnetometer({ frequency: 60 });
            magnetometerSensor.addEventListener('reading', () => {
                this.accX = parseFloat(magnetometerSensor.x.toFixed(2));
                this.accY = parseFloat(magnetometerSensor.y.toFixed(2));
                this.accZ = parseFloat(magnetometerSensor.z.toFixed(2));
            });
            magnetometerSensor.addEventListener('error', (event) => {
                console.error('Magnetometer Sensor Error:', event.error);
            });
            magnetometerSensor.start();
        } else {
            this.socket.emit('MagetometerError');
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

        this.socket.emit('sensorData', {
            alpha: this.alpha,
            beta: this.beta,
            gamma: this.gamma,
            accX: this.accX,
            accY: this.accY,
            accZ: this.accZ,
            timestamp: parseFloat(elapsedTime),
            userid: userID
        });
    }
}


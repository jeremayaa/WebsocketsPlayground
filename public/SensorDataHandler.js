export class SensorDataHandler {
    constructor(socket) {
        this.socket = socket;
        this.alpha = 0;
        this.beta = 0;
        this.gamma = 0;
        this.accX = 0;
        this.accY = 0;
        this.accZ = 0;
        this.interval = null;
        this.baseTimestamp = null;

        this.initializeListeners();

        // this.deviceType = window.innerWidth > 600 ? 'computer' : 'phone';
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.deviceType = isMobile ? 'phone' : 'computer';

        // console.log('Device Type Detected:', this.deviceType);
        if (this.deviceType === 'phone') {
            this.initializePhoneSensors();
        }
    }

    initializeListeners() {
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


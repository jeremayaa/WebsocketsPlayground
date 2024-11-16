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
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const deviceType = isMobile ? 'phone' : 'computer';

        if (this.deviceType === 'phone') {
                this.initializePhoneSensors();
    }
    }

}
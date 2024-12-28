// Main game logic
let devices = {};
let ballPosition = { x: 0, y: 0 }; // Ball position relative to the center
let ballVelocity = { x: 0, y: 0 }; // Ball velocity
const gravity = 0.1; // Simulated gravity

export function startGame(socket, roomspace) {
    devices = {};
    roomspace.innerHTML = '';

    let WhichSensors = {
                        'Accelerometer': 0,
                        'Gyroscope': 0,
                        'Magnetometer': 0,
                        'DeviceMotion': 0,
                        'DeviceOrientation': 1
                    };
    let delay = 50;

    roomspace.style.display = 'flex';
    roomspace.style.justifyContent = 'center';
    roomspace.style.alignItems = 'center';
    roomspace.style.height = '100vh';

    socket.on('selectedDevices', (data) => {
        devices = data;
        console.log(devices);
    });


    let measureButton = document.createElement('button');
    measureButton.textContent = 'Start game';
    roomspace.appendChild(measureButton);

    measureButton.addEventListener('click', () => {
        if (measureButton.textContent === 'Start game') {
            measureButton.textContent = 'Stop game';
            
            // Initialize measurements for each device
            devices.forEach(id => {
                socket.emit('StartMeasurementOnPhone', { userID: id, delay, WhichSensors });
            });

        } else {
            measureButton.textContent = 'Start game';
            
            devices.forEach(id => {
                socket.emit('StopMeasurementOnPhone', { userID: id });
            });
        }
    });

    // Create platform and ball elements
    let platform = document.createElement('div');
    platform.id = 'platform';
    platform.style.position = 'relative';
    platform.style.width = '500px';
    platform.style.height = '500px';
    platform.style.backgroundColor = '#ccc';
    platform.style.border = '2px solid #333';
    platform.style.borderRadius = '50%';
    platform.style.transformOrigin = 'center';
    platform.style.perspective = '1000px';
    roomspace.appendChild(platform);
    
    // Create ball element outside the platform
    let ball = document.createElement('div');
    ball.id = 'ball';
    ball.style.position = 'absolute';
    ball.style.width = '20px';
    ball.style.height = '20px';
    ball.style.backgroundColor = 'red';
    ball.style.borderRadius = '50%';
    ball.style.transform = 'translate(-50%, -50%)';
    roomspace.appendChild(ball);

    // Listen for sensor data
    socket.on('sensorData', (data) => {
        handleGameSensorData(data);
    });

    // Start animation loop
    animate(ball, platform);
}

export function stopGame(socket, roomspace) {
    roomspace.innerHTML = '';

    devices.forEach((id) => {
        socket.emit('StopMeasurementOnPhone', { userID: id });
        console.log(`Stopped game on phone for userID: ${id}`);
    });
}

function handleGameSensorData(data) {
    const platform = document.getElementById('platform');
    if (platform) {
        // Map sensor data to platform rotation angles
        const pitch = -parseFloat(data.doy) || 0; // Y-axis rotation
        const yaw = parseFloat(data.doz) || 0; // Z-axis rotation

        platform.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg)`;

        // Pass the tilt angles to update the ball's movement
        updateBall(pitch, yaw);
    }
}
function updateBall(pitch, yaw) {
    const ball = document.getElementById('ball');

    if (!ball) return;

    // Calculate acceleration based on platform tilt
    const ax = yaw * gravity / 45; // Yaw affects X-axis acceleration
    const ay = -pitch * gravity / 45; // Pitch affects Y-axis acceleration

    // Update ball velocity
    ballVelocity.x += ax;
    ballVelocity.y += ay;

    // Apply friction
    ballVelocity.x *= 0.98;
    ballVelocity.y *= 0.98;

    // Update ball position
    ballPosition.x += ballVelocity.x;
    ballPosition.y += ballVelocity.y;

    // Constrain ball to the platform
    const maxDistance = 250; // Radius of the platform
    const distance = Math.sqrt(ballPosition.x ** 2 + ballPosition.y ** 2);

    if (distance > maxDistance) {
        resetBall(); // Reset ball to the center if it hits the boundary
    }

    // Position ball relative to platform center
    const platformRect = document.getElementById('platform').getBoundingClientRect();
    const centerX = platformRect.left + platformRect.width / 2;
    const centerY = platformRect.top + platformRect.height / 2;

    ball.style.left = `${centerX + ballPosition.x}px`;
    ball.style.top = `${centerY + ballPosition.y}px`;
}

function resetBall() {
    ballPosition = { x: 0, y: 0 };
    ballVelocity = { x: 0, y: 0 };

    const ball = document.getElementById('ball');
    const platformRect = document.getElementById('platform').getBoundingClientRect();
    const centerX = platformRect.left + platformRect.width / 2;
    const centerY = platformRect.top + platformRect.height / 2;

    if (ball) {
        ball.style.left = `${centerX}px`;
        ball.style.top = `${centerY}px`;
    }
}

function animate(ball, platform) {
    if (!ball || !platform) return;

    updateBall(0, 0); // Continue updating ball without changing angles
    requestAnimationFrame(() => animate(ball, platform));
}

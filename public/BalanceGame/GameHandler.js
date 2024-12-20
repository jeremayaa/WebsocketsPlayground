// Main game logic
let devices = {};
let ballPosition = { x: 0, y: 0 }; // Ball position relative to the center
let ballVelocity = { x: 0, y: 0 }; // Ball velocity
const gravity = 0.5; // Simulated gravity

export function startGame(socket, roomspace) {
    devices = {};
    roomspace.innerHTML = '';

    socket.on('selectedDevices', (data) => {
        devices = data;
        console.log(`Selected devices: ${devices}`);

        devices.forEach((id) => {
            socket.emit('StartMeasurementOnPhone', {
                userID: id,
                delay: 50,
                WhichSensors: {
                    'Accelerometer': 0,
                    'Gyroscope': 0,
                    'Magnetometer': 0,
                    'DeviceMotion': 0,
                    'DeviceOrientation': 1
                }
            });
            console.log(`Started game measurement on phone for userID: ${id}`);
        });
    });

    // Create platform and ball elements
    let platform = document.createElement('div');
    platform.id = 'platform';
    platform.style.position = 'relative';
    platform.style.width = '300px';
    platform.style.height = '300px';
    platform.style.backgroundColor = '#ccc';
    platform.style.border = '2px solid #333';
    platform.style.transformOrigin = 'center';
    platform.style.perspective = '1000px';
    roomspace.appendChild(platform);

    let ball = document.createElement('div');
    ball.id = 'ball';
    ball.style.position = 'absolute';
    ball.style.width = '20px';
    ball.style.height = '20px';
    ball.style.backgroundColor = 'red';
    ball.style.borderRadius = '50%';
    ball.style.left = '50%';
    ball.style.top = '50%';
    ball.style.transform = 'translate(-50%, -50%)';
    platform.appendChild(ball);

    // Listen for sensor data
    socket.on('sensorData', (data) => {
        handleGameSensorData(data);
    });

    // Start animation loop
    animate(ball, platform);
}

export function stopGame(devices, socket) {
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
    const maxDistance = 140; // Radius of the platform
    const distance = Math.sqrt(ballPosition.x ** 2 + ballPosition.y ** 2);

    if (distance > maxDistance) {
        const angle = Math.atan2(ballPosition.y, ballPosition.x);
        ballPosition.x = maxDistance * Math.cos(angle);
        ballPosition.y = maxDistance * Math.sin(angle);
        ballVelocity.x = 0;
        ballVelocity.y = 0;
    }

    // Update ball position in the DOM
    ball.style.transform = `translate(${ballPosition.x}px, ${ballPosition.y}px)`;
}

function resetBall() {
    ballPosition = { x: 0, y: 0 };
    ballVelocity = { x: 0, y: 0 };
    const ball = document.getElementById('ball');
    if (ball) {
        ball.style.transform = 'translate(-50%, -50%)';
    }
}

function animate(ball, platform) {
    if (!ball || !platform) return;

    updateBall(0, 0); // Continue updating ball without changing angles
    requestAnimationFrame(() => animate(ball, platform));
}

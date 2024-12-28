// Main game logic
let devices = {};
let ballPosition = { x: 0, y: 0 }; // Ball position relative to the center
let ballVelocity = { x: 0, y: 0 }; // Ball velocity
const gravity = 0.3; // Simulated gravity

let score = 0;  // Initialize the score

function createScoreDisplay(roomspace) {
    let scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'scoreDisplay';
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.top = '10px';
    scoreDisplay.style.left = '1000px';
    scoreDisplay.style.fontSize = '24px';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.fontWeight = 'bold';
    scoreDisplay.textContent = `Score: ${score}`;
    roomspace.appendChild(scoreDisplay);
}

export function startGame(socket, roomspace) {
    devices = {};
    roomspace.innerHTML = '';

    roomspace.style.display = 'flex';
    roomspace.style.justifyContent = 'center';
    roomspace.style.alignItems = 'center';
    roomspace.style.height = '100vh';

    // Create the score display
    createScoreDisplay(roomspace);

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
    platform.style.width = '500px';
    platform.style.height = '500px';
    platform.style.backgroundColor = 'rgb(0, 0, 0)';
    platform.style.border = '2px solid rgb(255, 255, 255)';
    platform.style.borderRadius = '50%';
    platform.style.transformOrigin = 'center';
    platform.style.perspective = '1000px';
    roomspace.appendChild(platform);

    let ballWrapper = document.createElement('div');
    ballWrapper.style.position = 'absolute';
    ballWrapper.style.left = '50%';
    ballWrapper.style.top = '50%';
    ballWrapper.style.transform = 'translate(-50%, -50%)';
    platform.appendChild(ballWrapper);
    
    let ball = document.createElement('div');
    ball.id = 'ball';
    ball.style.position = 'absolute';
    ball.style.width = '20px';
    ball.style.height = '20px';
    ball.style.backgroundColor = 'orange';
    ball.style.borderRadius = '50%';
    ballWrapper.appendChild(ball);

    // Create random circles
    createRandomCircles(platform);

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
        updatePlatformGradient(pitch, yaw);
        // Pass the tilt angles to update the ball's movement
        updateBall(pitch, yaw);
    }
}


function updateBall(pitch, yaw) {
    const ball = document.getElementById('ball');
    const platform = document.getElementById('platform');

    if (!ball || !platform) return;

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

    // Calculate ball speed (magnitude of the velocity vector)
    const speed = Math.sqrt(ballVelocity.x ** 2 + ballVelocity.y ** 2);

    // Calculate the ball's direction (angle of movement)
    const angle = Math.atan2(ballVelocity.y, ballVelocity.x);

    // Adjust the gradient based on speed and direction
    updatePlatformGradient(speed, angle, platform);

    // Constrain ball to the platform
    const maxDistance = 250; // Radius of the platform
    const distance = Math.sqrt(ballPosition.x ** 2 + ballPosition.y ** 2);

    if (distance > maxDistance) {
        resetBall(); // Reset ball if it hits the boundary
    }

    // Update ball position in the DOM
    ball.style.transform = `translate(${ballPosition.x}px, ${ballPosition.y}px)`;

    checkCollisions();
}
function updatePlatformGradient(pitch, yaw) {
    const platform = document.getElementById('platform');
    if (!platform) return;

    // Normalize the pitch and yaw to get values between -1 and 1
    const normalizedPitch = pitch / 90;  // Pitch is usually between -90 and 90 degrees
    const normalizedYaw = yaw / 90;      // Yaw is usually between -90 and 90 degrees

    // The spread factor of the gradient (more spread when platform is near horizontal)
    const spread = 200 * (1 - Math.abs(normalizedPitch)); // Spread increases as the platform nears horizontal

    // Define the gradient direction (based on pitch and yaw)
    const angle = Math.atan2(normalizedPitch, normalizedYaw) * (180 / Math.PI); // Angle of the tilt in degrees

    // Set the platform background to a linear gradient
    platform.style.background = `linear-gradient(${angle}deg,rgb(54, 54, 54), rgba(0, 0, 0, 0.1))`;
    // platform.style.backgroundSize = `${spread}% ${spread}%`; // Control gradient spread
}



function resetBall() {
    ballPosition = { x: 0, y: 0 };
    ballVelocity = { x: 0, y: 0 };
    const ball = document.getElementById('ball');
    if (ball) {
        ball.style.transform = 'translate(-50%, -50%)';
    }

    // Decrease score when the ball is reset
    if (score > 0) {
        score-=5;
        if (score<0) {
            score = 0;
        }

        document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    }
}


function animate(ball, platform) {
    if (!ball || !platform) return;

    updateBall(0, 0); // Continue updating ball without changing angles
    requestAnimationFrame(() => animate(ball, platform));
}


let circles = []; // Store circle objects

function createRandomCircles(platform) {
    for (let i = 0; i < 5; i++) {  // Create 5 random circles
        let circle = document.createElement('div');
        let angle = Math.random() * Math.PI * 2; // Random angle for position
        let distance = Math.random() * 230; // Random distance from the center

        let x = Math.cos(angle) * distance;
        let y = Math.sin(angle) * distance;

        circle.style.position = 'absolute';
        circle.style.width = '30px';
        circle.style.height = '30px';
        circle.style.backgroundColor = 'rgb(255, 255, 255)';
        circle.style.borderRadius = '50%';
        circle.style.left = `50%`; // Center the platform
        circle.style.top = `50%`; // Center the platform
        circle.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;

        platform.appendChild(circle);
        circles.push({ element: circle, x, y });
    }
}

function checkCollisions() {
    const ball = document.getElementById('ball');
    if (!ball) return;

    // Get the ball's position relative to the platform
    const ballRect = ball.getBoundingClientRect();
    const ballCenter = {
        x: ballRect.left + ballRect.width / 2,
        y: ballRect.top + ballRect.height / 2
    };

    // Check each circle for collisions
    circles.forEach((circle, index) => {
        const dist = Math.sqrt(
            (circle.x - ballPosition.x) ** 2 + (circle.y - ballPosition.y) ** 2
        );

        if (dist <= 35) {  // Check if ball is close enough to the circle
            // Remove the circle from the DOM
            circle.element.remove();
            circles.splice(index, 1);  // Remove circle from the array

            // Increase score
            score++;
            document.getElementById('scoreDisplay').textContent = `Score: ${score}`;

            // Add a new circle after increasing the score
            addNewCircle(document.getElementById('platform'));
        }
    });
}

function addNewCircle(platform) {
    // Generate a random position for the new circle, ensuring it's within bounds
    let angle = Math.random() * Math.PI * 2; // Random angle for position
    let distance = Math.random() * 230; // Random distance between 20px and 250px (to avoid edge)

    let x = Math.cos(angle) * distance;
    let y = Math.sin(angle) * distance;

    let newCircle = document.createElement('div');
    newCircle.style.position = 'absolute';
    newCircle.style.width = '30px';
    newCircle.style.height = '30px';
    newCircle.style.backgroundColor = 'rgb(255, 255, 255)';
    newCircle.style.borderRadius = '50%';
    newCircle.style.left = `50%`; // Center the platform
    newCircle.style.top = `50%`; // Center the platform
    newCircle.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;

    platform.appendChild(newCircle);

    // Add the new circle to the circles array
    circles.push({ element: newCircle, x, y });
}

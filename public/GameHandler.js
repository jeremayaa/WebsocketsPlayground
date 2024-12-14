// export function startGame(sensors, socket, roomspace) {

//     roomspace.innerHTML = '';

//     let platform = document.createElement('div');
//     platform.id = 'platform';
//     roomspace.appendChild(platform);

//     let delay = 50;
//     let WhichSensors = {
//         'Accelerometer': 0,
//         'Gyroscope': 0,
//         'Magnetometer': 0,
//         'DeviceMotion': 0,
//         'DeviceOrientation': 1
//     };

//     socket.on('sensorData', (data) => {
//         handleGameSensorData(data);
//     });

//     sensors.forEach((id) => {
//         socket.emit('StartMeasurementOnPhone', { userID: id, delay, WhichSensors });
//         console.log(`Started game measurement on phone for userID: ${id}`);
//     });
// }

// export function stopGame(sensors, socket) {
//     sensors.forEach((id) => {
//         socket.emit('StopMeasurementOnPhone', { userID: id });
//         console.log(`Stopped game on phone for userID: ${id}`);
//     });
// }

// function handleGameSensorData(data) {
//     const platform = document.getElementById('platform');
//     if (platform) {
//         // Apply rotation based on the input degrees (doy and doz are assumed to be in degrees)
//         const rotationAngleA = `${data.doy}deg`; // Y-axis rotation (for horizontal tilt)
//         const rotationAngleB = `${-data.doz}deg`; // Z-axis rotation (for front-back tilt)
        
//         // Combine both rotations in a single transform statement
//         platform.style.transform = `rotateY(${rotationAngleB}) rotateX(${rotationAngleA})`;

//         // Calculate the gradient based on the rotation angles
//         // You can experiment with these values to fine-tune the effect
//         const gradientIntensity = Math.min(1, Math.abs(data.doy) / 90 + Math.abs(data.doz) / 90);  // Max intensity when rotating by 90 degrees

//         // Adjust the gradient based on the rotation magnitude
//         const gradient = `linear-gradient(
//             135deg, 
//             rgba(255, 255, 255, ${1 - gradientIntensity}) 0%, 
//             rgba(169, 169, 169, ${gradientIntensity}) 100%
//         )`;

//         // Apply the gradient as the background
//         platform.style.backgroundImage = gradient;
//     }
// }
export function startGame(sensors, socket, roomspace) {
    roomspace.innerHTML = '';

    let platform = document.createElement('div');
    platform.id = 'platform';
    roomspace.appendChild(platform);

    let ball = document.createElement('div');
    ball.id = 'ball';
    platform.appendChild(ball);

    let delay = 50;
    let WhichSensors = {
        'Accelerometer': 0,
        'Gyroscope': 0,
        'Magnetometer': 0,
        'DeviceMotion': 0,
        'DeviceOrientation': 1
    };

    socket.on('sensorData', (data) => {
        handleGameSensorData(data);
    });

    sensors.forEach((id) => {
        socket.emit('StartMeasurementOnPhone', { userID: id, delay, WhichSensors });
        console.log(`Started game measurement on phone for userID: ${id}`);
    });
}

export function stopGame(sensors, socket) {
    sensors.forEach((id) => {
        socket.emit('StopMeasurementOnPhone', { userID: id });
        console.log(`Stopped game on phone for userID: ${id}`);
    });
}

let ballPositionX = 250; // Starting at the center of the platform
let ballMovementInterval;

function handleGameSensorData(data) {
    const platform = document.getElementById('platform');
    const ball = document.getElementById('ball');
    if (platform && ball) {
        // Apply rotation based on the input degrees (doy and doz are assumed to be in degrees)
        const rotationAngleA = `${data.doy}deg`; // Y-axis rotation (for horizontal tilt)
        const rotationAngleB = `${-data.doz}deg`; // Z-axis rotation (for front-back tilt)

        // Combine both rotations in a single transform statement
        platform.style.transform = `rotateY(${rotationAngleB}) rotateX(${rotationAngleA})`;

        // Calculate the gradient based on the rotation angles
        const gradientIntensity = Math.min(1, Math.abs(data.doy) / 90 + Math.abs(data.doz) / 90); // Max intensity when rotating by 90 degrees

        // Adjust the gradient based on the rotation magnitude
        const gradient = `linear-gradient(
            135deg, 
            rgba(255, 255, 255, ${1 - gradientIntensity}) 0%, 
            rgba(169, 169, 169, ${gradientIntensity}) 100%
        )`;

        // Apply the gradient as the background
        platform.style.backgroundImage = gradient;

        // Clear the previous interval if any
        if (ballMovementInterval) clearInterval(ballMovementInterval);

        // Calculate the ball movement speed based on rotationAngleB
        const speed = Math.abs(parseFloat(rotationAngleB));

        // Move the ball to the left at a rate proportional to the speed
        if (speed > 0) {
            ballMovementInterval = setInterval(() => {
                ballPositionX = Math.max(0, ballPositionX - 1); // Prevent the ball from moving off the platform
                ball.style.left = `${ballPositionX}px`;
            }, 1000 / speed); // Speed determines the interval (frames per second)
        }
    }
}

const style = document.createElement('style');
style.textContent = `
    #platform {
        height: 500px;
        width: 500px;
        border-radius: 50%;
        background-color: aqua;
        transform-origin: center;
        position: relative;
        overflow: hidden;
    }

    #ball {
        height: 20px;
        width: 20px;
        background-color: red;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
`;
document.head.appendChild(style);
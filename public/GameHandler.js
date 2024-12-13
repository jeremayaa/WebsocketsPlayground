

export function startGame(sensors, socket, roomspace) {

    roomspace.innerHTML = '';

    let platform = document.createElement('div');
    platform.id = 'platform';
    roomspace.appendChild(platform);

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

function handleGameSensorData(data) {
    const platform = document.getElementById('platform');
    if (platform) {
        platform.style.width = `${data.dox}px`;
        platform.style.height = `${data.doy}px`;
    }
}

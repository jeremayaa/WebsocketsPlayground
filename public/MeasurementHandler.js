export function startMeasurement(sensors, socket, roomspace, measurements) {
    roomspace.innerHTML = '';

    let delay = 50;
    let WhichSensors = {
        'Accelerometer': 1,
        'Gyroscope': 1,
        'Magnetometer': 1,
        'DeviceMotion': 1,
        'DeviceOrientation': 1
    };

    socket.on('sensorData', (data) => {
        handleMeasurementSensorData(data, measurements);
    });

    sensors.forEach((id) => {
        let AvailableSensorsCheckbox = document.createElement('p');
        AvailableSensorsCheckbox.innerHTML = `sensor ${id}`;
        roomspace.appendChild(AvailableSensorsCheckbox);

        const PlaceToShowData = document.createElement('p');
        PlaceToShowData.id = `${id}-PlaceToShowData`;
        PlaceToShowData.textContent = `Device enabled for user ${id}`;
        roomspace.appendChild(PlaceToShowData);

        socket.emit('StartMeasurementOnPhone', { userID: id, delay, WhichSensors });
        console.log(`Started measurement on phone for userID: ${id}`);
    });
}

export function stopMeasurement(sensors, socket, roomspace, measurements) {

    sensors.forEach((id) => {
        socket.emit('StopMeasurementOnPhone', { userID: id });
        console.log(`Stopped measurement on phone for userID: ${id}`);
    });

    const saveCSVButton = document.createElement('button');
    saveCSVButton.textContent = 'Pobierz dane';
    roomspace.appendChild(saveCSVButton);

    saveCSVButton.addEventListener('click', () => {
        for (const userid in measurements) {
            if (measurements.hasOwnProperty(userid)) {
                const csvContent = createCSV(measurements[userid]);
                const date = new Date().toISOString().split('T')[0];
                const fileName = `${userid}-${date}.csv`;

                downloadCSV(csvContent, fileName);
            }
        }
    });
}

function handleMeasurementSensorData(data, measurements) {
    if (!measurements[data.userid]) {
        measurements[data.userid] = [];
    }

    measurements[data.userid].push({
        ax: data.ax,
        ay: data.ay,
        az: data.az,
        gx: data.gx,
        gy: data.gy,
        gz: data.gz,
        mx: data.mx,
        my: data.my,
        mz: data.mz,
        dmx: data.dmx,
        dmy: data.dmy,
        dmz: data.dmz,
        dox: data.dox,
        doy: data.doy,
        doz: data.doz,
        timestamp: data.timestamp
    });

    const PlaceToShowData = document.getElementById(`${data.userid}-PlaceToShowData`);
    if (PlaceToShowData) {
        PlaceToShowData.innerHTML = `ax = ${data.ax}, ay = ${data.ay}, az = ${data.az}<br>
            gx = ${data.gx}, gy = ${data.gy}, gz = ${data.gz} <br>
            mx = ${data.mx}, my = ${data.my}, mz = ${data.mz} <br>
            dmx = ${data.dmx}, dmy = ${data.dmy}, dmz = ${data.dmz} <br>
            dox = ${data.dox}, doy = ${data.doy}, doz = ${data.doz} <br>
            userID = ${data.userid}`;
    }
}

function createCSV(dataArray) {
    if (dataArray.length === 0) return '';

    const headers = Object.keys(dataArray[0]);
    const csvRows = [
        headers.join(','),
        ...dataArray.map(row => headers.map(field => JSON.stringify(row[field])).join(',')),
    ];

    return csvRows.join('\n');
}

function downloadCSV(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

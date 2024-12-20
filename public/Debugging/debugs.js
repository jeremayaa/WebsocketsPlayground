
let devices = {};
let measurements = {}; // Object to store data for each device

export function init(socket, roomspace) {
    devices = {};
    measurements = {}; // Initialize measurements object

    let devicesParagraph = document.createElement('p');
    roomspace.appendChild(devicesParagraph);

    socket.on('selectedDevices', (data) => {
        devices = data;
        devicesParagraph.textContent = devices;
        console.log(devices);
    });

    let delay = 50;
    let WhichSensors = {
        'Accelerometer': 1,
        'Gyroscope': 1,
        'Magnetometer': 1,
        'DeviceMotion': 1,
        'DeviceOrientation': 1
    };

    let measureButton = document.createElement('button');
    measureButton.textContent = 'Start measurement';
    roomspace.appendChild(measureButton);

    measureButton.addEventListener('click', () => {
        if (measureButton.textContent === 'Start measurement') {
            measureButton.textContent = 'Stop measurement';
            
            // Initialize measurements for each device
            devices.forEach(id => {
                measurements[id] = [];
                socket.emit('StartMeasurementOnPhone', { userID: id, delay, WhichSensors });

                let PlaceToShowData = document.createElement('p');
                PlaceToShowData.id = `PlaceToShowData-${id}`;
                roomspace.appendChild(PlaceToShowData);
            });

        } else {
            measureButton.textContent = 'Start measurement';
            
            // Stop measurements and save data to CSV
            devices.forEach(id => {
                socket.emit('StopMeasurementOnPhone', { userID: id });

                // Generate CSV content
                const csvContent = generateCSV(measurements[id]);

                // Trigger download
                downloadCSV(`device_${id}_measurements.csv`, csvContent);

                // Clear stored measurements
                measurements[id] = [];
            });
        }
    });

    socket.on('sensorData', (data) => {
        let PlaceToShowData = document.getElementById(`PlaceToShowData-${data.userid}`);
        if (PlaceToShowData) {
            PlaceToShowData.innerHTML = `ax = ${data.ax}, ay = ${data.ay}, az = ${data.az}<br>
            gx = ${data.gx}, gy = ${data.gy}, gz = ${data.gz} <br>
            mx = ${data.mx}, my = ${data.my}, mz = ${data.mz} <br>
            dmx = ${data.dmx}, dmy = ${data.dmy}, dmz = ${data.dmz} <br>
            dox = ${data.dox}, doy = ${data.doy}, doz = ${data.doz} <br>
            timestamp = ${data.timestamp} <br>
            userID = ${data.userid}`;
        }

        // Accumulate data for the corresponding device
        if (measurements[data.userid]) {
            measurements[data.userid].push(data);
        }
    });
};

export function terminate(socket, roomspace) {
    roomspace.innerHTML = '';
};

function generateCSV(data) {
    // Define CSV headers
    const headers = [
        'ax', 'ay', 'az',
        'gx', 'gy', 'gz',
        'mx', 'my', 'mz',
        'dmx', 'dmy', 'dmz',
        'dox', 'doy', 'doz',
        'timestamp'
    ];

    // Map data to CSV rows
    const rows = data.map(entry => (
        [
            entry.ax, entry.ay, entry.az,
            entry.gx, entry.gy, entry.gz,
            entry.mx, entry.my, entry.mz,
            entry.dmx, entry.dmy, entry.dmz,
            entry.dox, entry.doy, entry.doz,
            entry.timestamp
        ].join(',')
    ));

    // Combine headers and rows
    return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(filename, content) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

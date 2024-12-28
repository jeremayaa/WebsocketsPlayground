let devices = {};
let measurements = {}; // Object to store data for each device

export function startMeasurement(socket, roomspace) {
    devices = {};
    measurements = {}; // Initialize measurements object
    roomspace.innerHTML = '';

    let devicesParagraph = document.createElement('p');
    devicesParagraph.style.textAlign = 'center';
    roomspace.appendChild(devicesParagraph);

    socket.on('selectedDevices', (data) => {
        devices = data;
        devicesParagraph.textContent = `Devices: ${devices.join(', ')}`;
        console.log(devices);
    });

    let delay = 50;
    let WhichSensors = {
        'Accelerometer': 1,
        'Gyroscope': 1,
        'Magnetometer': 1,
        'DeviceMotion': 0,
        'DeviceOrientation': 0
    };

    let measureButton = document.createElement('button');
    measureButton.textContent = 'Start measurement';
    measureButton.style.backgroundColor = '#4CAF50';
    measureButton.style.color = 'white';
    measureButton.style.border = 'none';
    measureButton.style.padding = '10px 20px';
    measureButton.style.fontSize = '16px';
    measureButton.style.cursor = 'pointer';
    measureButton.style.marginTop = '20px';
    measureButton.style.transition = 'background-color 0.3s';
    roomspace.appendChild(measureButton);

    measureButton.addEventListener('mouseover', () => {
        measureButton.style.backgroundColor = '#45a049';
    });

    measureButton.addEventListener('mouseout', () => {
        measureButton.style.backgroundColor = '#4CAF50';
    });

    let sensorSelector = document.createElement('select');
    sensorSelector.style.padding = '10px';
    sensorSelector.style.fontSize = '16px';
    sensorSelector.style.marginTop = '20px';
    roomspace.appendChild(sensorSelector);

    ['Accelerometer', 'Gyroscope', 'Magnetometer'].forEach(sensor => {
        let option = document.createElement('option');
        option.value = sensor;
        option.textContent = sensor;
        sensorSelector.appendChild(option);
    });

    let charts = {}; // Store chart instances for each device
    let chartContainers = {}; // Keep track of chart containers to avoid stacking

    measureButton.addEventListener('click', () => {
        if (measureButton.textContent === 'Start measurement') {
            measureButton.textContent = 'Stop measurement';

            // Initialize measurements and charts for each device
            devices.forEach(id => {
                measurements[id] = [];
                socket.emit('StartMeasurementOnPhone', { userID: id, delay, WhichSensors });

                // Remove existing chart container if present
                if (chartContainers[id]) {
                    chartContainers[id].remove();
                }

                // Create a canvas for the chart
                let chartContainer = document.createElement('div');
                chartContainer.style.marginBottom = '20px';
                chartContainer.style.width = '80%';
                chartContainer.style.height = '300px';

                chartContainer.style.maxWidth = '600px';  // Wider chart
                chartContainer.style.margin = '0 auto'; // Center the container
                chartContainers[id] = chartContainer;

                let canvas = document.createElement('canvas');
                canvas.id = `chart-${id}`;
                chartContainer.appendChild(canvas);
                roomspace.appendChild(chartContainer);

                // Initialize Chart.js chart
                let ctx = canvas.getContext('2d');
                charts[id] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [
                            {
                                label: 'x',
                                data: [],
                                borderColor: 'red',
                                borderWidth: 2,
                                fill: false
                            },
                            {
                                label: 'y',
                                data: [],
                                borderColor: 'green',
                                borderWidth: 2,
                                fill: false
                            },
                            {
                                label: 'z',
                                data: [],
                                borderColor: 'blue',
                                borderWidth: 2,
                                fill: false
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false, // Disable animation for real-time updates
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Time',
                                    font: {
                                        size: 14
                                    }
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Sensor Data',
                                    font: {
                                        size: 14
                                    }
                                },
                                ticks: {
                                    beginAtZero: true
                                }
                            }
                        }
                    }
                });
            });

        } else {
            measureButton.textContent = 'Start measurement';

            // Stop measurements and clear charts
            devices.forEach(id => {
                socket.emit('StopMeasurementOnPhone', { userID: id });
                if (charts[id]) {
                    charts[id].destroy();
                    delete charts[id];
                }
                if (chartContainers[id]) {
                    chartContainers[id].remove();
                    delete chartContainers[id];
                }
            });
        }
    });

    socket.on('sensorData', (data) => {
        // Ensure the data is being captured continuously
        if (!charts[data.userid]) return; // Skip if chart not initialized

        let selectedSensor = sensorSelector.value; // Get the selected sensor type
        let chart = charts[data.userid];
        let labels = chart.data.labels;
        let datasets = chart.data.datasets;

        // Map data based on selected sensor
        let sensorData = {
            Accelerometer: [data.ax, data.ay, data.az],
            Gyroscope: [data.gx, data.gy, data.gz],
            Magnetometer: [data.mx, data.my, data.mz]
        }[selectedSensor];

        if (!sensorData) return; // Skip if no data for selected sensor

        // Add new data to chart datasets
        let timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // Simplified timestamp
        labels.push(timestamp);
        datasets[0].data.push(sensorData[0]);
        datasets[1].data.push(sensorData[1]);
        datasets[2].data.push(sensorData[2]);

        // Limit data points to the last 50 entries
        if (labels.length > 50) {
            labels.shift();
            datasets.forEach(dataset => dataset.data.shift());
        }

        chart.update();

        // Accumulate data for the corresponding device
        if (measurements[data.userid]) {
            measurements[data.userid].push(data);
        }
    });
};

export function stopMeasurement(socket, roomspace) {
    devices.forEach((id) => {
        socket.emit('StopMeasurementOnPhone', { userID: id });
        console.log(`Stopped measurement on phone for userID: ${id}`);
    });
    roomspace.innerHTML = '';
};

import { SensorDataHandler } from './SensorDataHandler.js';


const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const deviceType = isMobile ? 'phone' : 'computer';
console.log(deviceType);

const content = document.getElementById('content');
content.innerHTML = `${deviceType}`;

// wygodny divek do wyświetlania wiadomości do debugowania
const messagesDiv = document.getElementById('messages');
const roomspace = document.getElementById('roomspace');

const socket = io();

// stwórz instancję klasy odpowiadającej za zbieranie i wysyłanie danych z telefonu
const sensorHandler = new SensorDataHandler(socket);

let userID = localStorage.getItem('userID');


// jeśli nie ustawiono username, zapisz utwórz go i zapisz w localstorage.
if (!userID) {
    const UserNameField = document.createElement('input');
    UserNameField.type = 'text';
    UserNameField.placeholder = 'Enter your username'
    const SaveUsernameButton = document.createElement('button');
    SaveUsernameButton.textContent = 'Save username';
    
    content.appendChild(UserNameField);
    content.appendChild(SaveUsernameButton);

    SaveUsernameButton.addEventListener('click', () => {
        const UserName = UserNameField.value;
        localStorage.setItem('userID', UserName);
        });
    }

// Emituj event 'setUserID -> plik server.js tworzy mapę socket.id do userID. 
// Jest to konieczne, bo socket.id zmienia się za każdym razem gdy odświerzymy stronę
// user id jest przechowywane w pamięci urządzenia i jest zapamiętapne przy każdym nastęnym uruchomienu strony
if (userID) {
    socket.emit('setUserID', { userID, isMobile } ); 
}

// Na komputerze dodaj przycisk do rozpoczęcia pomiaru oraz gry
const measureButton = document.createElement('button');
const saveCSVButton = document.createElement('button');
const gameButton = document.createElement('button');

if (deviceType==='computer') {
    // na komputerze dodaj przycisk 'rozpocznij pomiar'
    measureButton.textContent = 'rozpocznij pomiar';
    gameButton.textContent = 'rozpocznij grę';

    roomspace.appendChild(measureButton);
    roomspace.appendChild(gameButton);
}

let sensors = [];

socket.on('AvailableSensors', ({AvailableSensors, userID}) => {

    const LeftPanelDeviceInfo = document.createElement('p');
    LeftPanelDeviceInfo.id = `${userID}-LeftPanelDeviceInfo`;
    
    // na komputerze wyświetl informacje o dostępnym urządzeniu wraz z jego sensorami oraz 
    // checkbox który umożliwia dodanie sensoru
    if (deviceType==='computer') {

        LeftPanelDeviceInfo.textContent = `Enable sensor: ${userID}
        Available sensors are: Accelerometer: ${AvailableSensors['Accelerometer']},
                        Gyroscope: ${AvailableSensors['Gyroscope']},
                        Magnetometer: ${AvailableSensors['Magnetometer']},
                        OrientationEvent: ${AvailableSensors['OrientationEvent']},
                        MotionEvent: ${AvailableSensors['MotionEvent']}`;

        messagesDiv.appendChild(LeftPanelDeviceInfo);
        
        const EnableDeviceCheckbox = document.createElement('input');
        EnableDeviceCheckbox.type = 'checkbox';
        EnableDeviceCheckbox.id = `${userID}-checkbox`;

        messagesDiv.appendChild(EnableDeviceCheckbox);
    }

    // po kliknięciu checkboxa rozpocznij pomiar / po odkliknięciu zakończ
    const EnableDeviceCheckbox = document.getElementById(`${userID}-checkbox`);

    EnableDeviceCheckbox.addEventListener('click', () => {
        if (EnableDeviceCheckbox.checked) {
            const PlaceToShowData = document.createElement('p');
            PlaceToShowData.id = `${userID}-PlaceToShowData`;
            PlaceToShowData.textContent = `Device enabled for user ${userID}`;
            roomspace.appendChild(PlaceToShowData);
            sensors.push(userID);
            console.log(`Device enabled for userID: ${userID}`);
        } else {
            const PlaceToShowData = document.getElementById(`${userID}-PlaceToShowData`);
            roomspace.removeChild(PlaceToShowData);
            sensors = sensors.filter(id => id !== userID);
            console.log(`Device disabled for userID: ${userID}`);
        }
    });
    
});

// Usuń checkbox umożliwiający pomiar dla sensorów które wyszły z pokoju
socket.on('SendInfoAboutDisconnection', (userID) => {
    const checkbox = document.getElementById(`${userID}-checkbox`);
    const LeftPanelSensorInfo = document.getElementById(`${userID}-LeftPanelDeviceInfo`);
    const PlaceToShowData = document.getElementById(`${userID}-PlaceToShowData`);

    if (checkbox) {
        messagesDiv.removeChild(checkbox);
    }
    if (LeftPanelSensorInfo) {
        messagesDiv.removeChild(LeftPanelSensorInfo);
    }
    if (PlaceToShowData) {
        roomspace.removeChild(PlaceToShowData);
    }
}) 

let isPlaying = false;

gameButton.addEventListener('click', () => {
    if (gameButton.textContent === 'rozpocznij grę') {
        gameButton.textContent = 'zakończ grę';
        isPlaying = true;

        let platform = document.createElement('div');
        platform.id = 'platform';
        roomspace.appendChild(platform);

        let delay = 50;
        let WhichSensors = {
            'Accelerometer': 1,
            'Gyroscope': 1,
            'Magnetometer': 0,
            'DeviceMotion': 1,
            'DeviceOrientation': 1
        };

        sensors.forEach((id) => {
            socket.emit('StartMeasurementOnPhone', { userID: id, delay, WhichSensors });
            console.log(`Started game measurement on phone for userID: ${id}`);
        });

    } else {
        gameButton.textContent = 'rozpocznij grę';
        isPlaying = false;

        sensors.forEach((id) => {
            socket.emit('StopMeasurementOnPhone', { userID: id });
            console.log(`Stopped game measurement on phone for userID: ${id}`);
        });

        const platform = document.getElementById('platform');
        if (platform) roomspace.removeChild(platform);
    }
});

let measurements = {};
let isMeasuring = false;

measureButton.addEventListener('click', () => {
    if (measureButton.textContent === 'rozpocznij pomiar') {
        measureButton.textContent = 'zakończ pomiar';
        isMeasuring = true;

        let delay = 100;
        let WhichSensors = {
            'Accelerometer': 1,
            'Gyroscope': 1,
            'Magnetometer': 1,
            'DeviceMotion': 1,
            'DeviceOrientation': 1
        };

        sensors.forEach((id) => {
            socket.emit('StartMeasurementOnPhone', { userID: id, delay, WhichSensors });
            console.log(`Started measurement on phone for userID: ${id}`);
        });

        measurements = {};
    } else {
        measureButton.textContent = 'rozpocznij pomiar';
        isMeasuring = false;

        sensors.forEach((id) => {
            socket.emit('StopMeasurementOnPhone', { userID: id });
            console.log(`Stopped measurement on phone for userID: ${id}`);
        });

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
});

// jeśli rozpoczęto pomiar dodaj nowe dane

function handleGameSensorData(data) {
    const platform = document.getElementById('platform');
    if (platform) {
        platform.style.width = `${data.dox}px`; 
        platform.style.height = `${data.doy}px`;
    }
}

function handleMeasurementSensorData(data) {
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

// Sensor data event listener
socket.on('sensorData', (data) => {
    if (isPlaying) {
        handleGameSensorData(data);
    }
    if (isMeasuring) {
        handleMeasurementSensorData(data);
    }
});
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

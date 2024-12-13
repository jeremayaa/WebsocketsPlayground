import { SensorDataHandler } from './SensorDataHandler.js';
import { startGame, stopGame } from './GameHandler.js';
import { startMeasurement, stopMeasurement } from './MeasurementHandler.js';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const deviceType = isMobile ? 'phone' : 'computer';
console.log(deviceType);

const content = document.getElementById('content');
content.innerHTML = `${deviceType}`;

const messagesDiv = document.getElementById('messages');
const roomspace = document.getElementById('roomspace');

const socket = io();

// Create an instance of the class for collecting and sending phone data
const sensorHandler = new SensorDataHandler(socket);

let userID = localStorage.getItem('userID');

// If username is not set, create and save it in localStorage
if (!userID) {
    const UserNameField = document.createElement('input');
    UserNameField.type = 'text';
    UserNameField.placeholder = 'Enter your username';

    const SaveUsernameButton = document.createElement('button');
    SaveUsernameButton.textContent = 'Save username';

    content.appendChild(UserNameField);
    content.appendChild(SaveUsernameButton);

    SaveUsernameButton.addEventListener('click', () => {
        const UserName = UserNameField.value;
        localStorage.setItem('userID', UserName);
        location.reload();
    });
}

// Emit the 'setUserID' event to associate userID with socket.id
if (userID) {
    socket.emit('setUserID', { userID, isMobile });
}

// On computer, add a select element and start button
if (deviceType === 'computer') {
    const actionSelect = document.createElement('select');
    const startButton = document.createElement('button');

    const measureOption = document.createElement('option');
    measureOption.value = 'measure';
    measureOption.textContent = 'Rozpocznij pomiar';

    const gameOption = document.createElement('option');
    gameOption.value = 'game';
    gameOption.textContent = 'Rozpocznij grę';

    actionSelect.appendChild(measureOption);
    actionSelect.appendChild(gameOption);

    startButton.textContent = 'Start';

    content.appendChild(actionSelect);
    content.appendChild(startButton);

    let sensors = [];
    let isActionActive = false;
    let measurements = {};

    socket.on('AvailableSensors', ({ AvailableSensors, userID }) => {
        const LeftPanelDeviceInfo = document.createElement('p');
        LeftPanelDeviceInfo.id = `${userID}-LeftPanelDeviceInfo`;

        if (deviceType === 'computer') {
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

            EnableDeviceCheckbox.addEventListener('click', () => {
                if (EnableDeviceCheckbox.checked) {
                    sensors.push(userID);
                    console.log(`Device enabled for userID: ${userID}`);
                } else {
                    sensors = sensors.filter(id => id !== userID);
                    console.log(`Device disabled for userID: ${userID}`);
                }
            });
        }
    });

    socket.on('SendInfoAboutDisconnection', (userID) => {
        const checkbox = document.getElementById(`${userID}-checkbox`);
        const LeftPanelSensorInfo = document.getElementById(`${userID}-LeftPanelDeviceInfo`);

        if (checkbox) {
            messagesDiv.removeChild(checkbox);
        }
        if (LeftPanelSensorInfo) {
            messagesDiv.removeChild(LeftPanelSensorInfo);
        }
    });

    startButton.addEventListener('click', () => {
        const selectedAction = actionSelect.value;
        if (isActionActive) {
            if (selectedAction === 'game') {
                stopGame(sensors, socket);
            } else if (selectedAction === 'measure') {
                stopMeasurement(sensors, socket, roomspace, measurements);
                measurements = {};
            }

            startButton.textContent = 'Start';
            isActionActive = false;
        } else {
            if (selectedAction === 'game') {
                startGame(sensors, socket, roomspace);
            } else if (selectedAction === 'measure') {
                startMeasurement(sensors, socket, roomspace, measurements);
            }

            startButton.textContent = 'Stop';
            isActionActive = true;
        }
    });
}

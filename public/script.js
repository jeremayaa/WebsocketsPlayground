import { SensorDataHandler } from './SensorDataHandler.js';
import { startGame, stopGame } from './BalanceGame/GameHandler.js';
import { startMeasurement, stopMeasurement } from './Measurement/MeasurementHandler.js';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const deviceType = isMobile ? 'phone' : 'computer';
console.log(deviceType);

const content = document.getElementById('toolbar');
content.innerHTML = `${deviceType}`;

const LeftPanelDiv= document.getElementById('leftPanel');
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
    // const startButton = document.createElement('button');

    const measureOption = document.createElement('option');
    measureOption.value = 'measure';
    measureOption.textContent = 'Rozpocznij pomiar';

    const gameOption = document.createElement('option');
    gameOption.value = 'game';
    gameOption.textContent = 'Rozpocznij grę';

    actionSelect.appendChild(measureOption);
    actionSelect.appendChild(gameOption);

    // startButton.textContent = 'Start';

    LeftPanelDiv.appendChild(actionSelect);
    // LeftPanelDiv.appendChild(startButton);

    let devices = [];
    // let isActionActive = false;
    // let measurements = {};

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

            LeftPanelDiv.appendChild(LeftPanelDeviceInfo);

            const EnableDeviceCheckbox = document.createElement('input');
            EnableDeviceCheckbox.type = 'checkbox';
            EnableDeviceCheckbox.id = `${userID}-checkbox`;

            LeftPanelDiv.appendChild(EnableDeviceCheckbox);

            EnableDeviceCheckbox.addEventListener('click', () => {
                if (EnableDeviceCheckbox.checked) {
                    devices.push(userID);
                    console.log(`Device enabled for userID: ${userID}`);
                } else {
                    devices = devices.filter(id => id !== userID);
                    console.log(`Device disabled for userID: ${userID}`);
                }
            });
        }
    });

    socket.on('SendInfoAboutDisconnection', (userID) => {
        const checkbox = document.getElementById(`${userID}-checkbox`);
        const LeftPanelSensorInfo = document.getElementById(`${userID}-LeftPanelDeviceInfo`);

        devices = devices.filter(id => id !== userID);

        if (checkbox) {
            LeftPanelDiv.removeChild(checkbox);
        }
        if (LeftPanelSensorInfo) {
            LeftPanelDiv.removeChild(LeftPanelSensorInfo);
        }
    });


    const actions = {
        game: {
            start: (devices, socket, roomspace) => startGame(devices, socket, roomspace),
            stop: (devices, socket) => stopGame(devices, socket)
        },
        measure: {
            start: (devices, socket, roomspace, measurements) => startMeasurement(devices, socket, roomspace, measurements),
            stop: (devices, socket, roomspace, measurements) => {
                stopMeasurement(devices, socket, roomspace, measurements);
                measurements = {}; // Reset measurements
            }
        }
        // Add more actions here in the future
    };
    
    let currentAction = null;
    let measurements = {}; // To handle the 'measure' action
    
    // Listen to changes in the action selector
    actionSelect.addEventListener('change', () => {
        const selectedAction = actionSelect.value;
    
        // Stop the current action if there is one
        if (currentAction && actions[currentAction] && actions[currentAction].stop) {
            actions[currentAction].stop(devices, socket, roomspace, measurements);
        }
    
        // Start the newly selected action
        if (actions[selectedAction] && actions[selectedAction].start) {
            actions[selectedAction].start(devices, socket, roomspace, measurements);
        }
    
        // Update the current action
        currentAction = selectedAction;
    });
    
    // Optionally, trigger the initial action on page load if a default is set
    if (actionSelect.value) {
        actionSelect.dispatchEvent(new Event('change'));
    }
}

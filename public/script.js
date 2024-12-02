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
    socket.emit('setUserID', userID); 
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

socket.on('SendInfoAboutJoining', (userID) => {
    const parragraph = document.createElement('p');
    parragraph.id = `${userID}-parragraph`;
    
    
    // na komputerze wyświetl checkbox umożliwiający rozpoczęcia pomiaru na tym sensorze
    if (deviceType==='computer') {
        parragraph.textContent = `Enable sensor: ${userID}`;
        messagesDiv.appendChild(parragraph);
        
        const EnableSensorCheckbox = document.createElement('input');
        EnableSensorCheckbox.type = 'checkbox';
        EnableSensorCheckbox.id = `${userID}-checkbox`;

        messagesDiv.appendChild(EnableSensorCheckbox);
    }

    // po kliknięciu checkboxa rozpocznij pomiar / po odkliknięciu zakończ
    const EnableSensorCheckbox = document.getElementById(`${userID}-checkbox`);

    EnableSensorCheckbox.addEventListener('click', () => {
        if (EnableSensorCheckbox.checked) {
            const PlaceToShowData = document.createElement('p');
            PlaceToShowData.id = `${userID}-PlaceToShowData`;
            PlaceToShowData.textContent = `Place To show data ${userID}`;
            roomspace.appendChild(PlaceToShowData);
            let delay = 25;
            socket.emit('StartMeasurementOnPhone', { userID, delay });
            console.log(`Started measurement on phone for userID: ${userID}`);

        } else {
            const PlaceToShowData = document.getElementById( `${userID}-PlaceToShowData`);
            roomspace.removeChild(PlaceToShowData);
            socket.emit('StopMeasurementOnPhone', { userID });
        }
    })
});

// Usuń checkbox umożliwiający pomiar dla sensorów które wyszły z pokoju
socket.on('SendInfoAboutDisconnection', (userID) => {
    const checkbox = document.getElementById(`${userID}-checkbox`);
    const parragraph = document.getElementById(`${userID}-parragraph`);
    const PlaceToShowData = document.getElementById(`${userID}-PlaceToShowData`);

    if (checkbox) {
        messagesDiv.removeChild(checkbox);
    }
    if (parragraph) {
        messagesDiv.removeChild(parragraph);
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


    } else {
        gameButton.textContent = 'rozpocznij grę';
        isPlaying = false;
        roomspace.removeChild(platform);
    }
})

let measurements = {};
let isMeasuring = false;

measureButton.addEventListener('click', () => {
    if (measureButton.textContent === 'rozpocznij pomiar') {
        measureButton.textContent = 'zakończ pomiar';
        isMeasuring = true;

        measurements = {};
    } else {
        measureButton.textContent = 'rozpocznij pomiar';
        isMeasuring = false;

        // Po zakończeniu pomiaru zapisz dane w csv
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
        })
    }
});

// jeśli rozpoczęto pomiar dodaj nowe dane
socket.on('sensorData', (data) => {
    if (isMeasuring) {
        if (!measurements[data.userid]) {
            measurements[data.userid] = [];
        }
        
        measurements[data.userid].push({
            alpha: data.alpha,
            beta: data.beta,
            gamma: data.gamma,
            accX: data.accX,
            accY: data.accY,
            accZ: data.accZ,
            timestamp: data.timestamp
        });

        const PlaceToShowData = document.getElementById(`${data.userid}-PlaceToShowData`);
        PlaceToShowData.innerHTML = `a = ${data.alpha}, b = ${data.beta}, g = ${data.gamma}<br>
                accX = ${data.accX}, accY = ${data.accY}, accZ = ${data.accZ} <br>
                userID = ${data.userid}`;
    }

    if (isPlaying) {
        // width of div with id 'platform' = data.alpha
        // height of div with id 'platform' = data.beta
        const platform = document.getElementById('platform');

        platform.style.width = `${data.alpha}px`; // Set width dynamically
        platform.style.height = `${data.beta}px`; // Set height dynamically
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

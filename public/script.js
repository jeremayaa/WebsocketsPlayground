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

// na komputerze można wygenerować pokój
const measureButton = document.createElement('button');
if (deviceType==='computer') {

    const RoomCodeField = document.createElement('input');
    RoomCodeField.type = 'text';
    RoomCodeField.placeholder = 'Enter room code'
    const CreateRoomButton = document.createElement('button');
    CreateRoomButton.textContent = 'Create room';

    content.appendChild(RoomCodeField);
    content.appendChild(CreateRoomButton);

    // Po kliknięciu przysicku wyemituj CreateRoom -> plik server.js wyśle zaproszenia do wszystkich użytkowników
    CreateRoomButton.addEventListener('click', () => {
        const RoomName = RoomCodeField.value;
        let data = {RoomName, userID}
        socket.emit('CreateRoom', (data));

        // na komputerze dodaj przycisk 'rozpocznij pomiar'
        
        measureButton.textContent = 'rozpocznij pomiar';
    
        if (deviceType==='computer') {
            roomspace.appendChild(measureButton);
        }
        });

}

measureButton.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][id$="-checkbox"]');

    checkboxes.forEach((checkbox) => {
        // Check if the checkbox is checked
        const userID = checkbox.id.replace('-checkbox', '');
        if (checkbox.checked) {
            // Extract the userID from the checkbox ID (e.g., "Motorola-checkbox" -> "Motorola")

            // Emit the 'StartMeasurementOnPhone' event for each checked sensor
            socket.emit('StartMeasurementOnPhone', { userID });
            console.log(`Started measurement on phone for userID: ${userID}`);
        } else {
            socket.emit('StopMeasurementOnPhone', { userID });
        }
    });
})

socket.on('giveSensors', (sensors) => {
    // alert(sensors);
    console.log(sensors);
})

// Gdy zaproszenie zostanie wysłane dodaj przycisk umożliwiający na dołaczenie do pokoju
socket.on('Invitation', (RoomName) => {
    const RoomNameParagraph = document.createElement('p');
    const JoinRoomButton = document.createElement('button');
    JoinRoomButton.textContent = 'Join room';
    RoomNameParagraph.textContent = RoomName;
    messagesDiv.appendChild(RoomNameParagraph);
    messagesDiv.appendChild(JoinRoomButton);

    // wyemituj even 'joinRoom' -> plik server.js doda userID do listy sensorów w pokoju
    let data = {RoomName, userID};
    JoinRoomButton.addEventListener('click', () => {
        socket.emit('joinRoom', (data));
        // zapobiega ponownemu dołączeniu do pokoju
        messagesDiv.removeChild(JoinRoomButton);
        })

});



// Wyświetl informację o innych użytkownikach którzy dołączyli do servera
socket.on('SendInfoAboutJoining', (data) => {
    // const {userID, RoomName} = data;

    const parragraph = document.createElement('p');
    parragraph.textContent = `Room ${data.RoomName} was joined by ${data.userID}`;
    messagesDiv.appendChild(parragraph);

    if (deviceType==='computer') {
        // messagesDiv.
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${data.userID}-checkbox`;

        const label = document.createElement("label");
        label.htmlFor = "myCheckbox";
        label.textContent = "Enable sensor"; // Change the text to whatever you like

        messagesDiv.appendChild(checkbox);
        messagesDiv.appendChild(label);
    }

});

const parragraph2 = document.createElement('p');
messagesDiv.appendChild(parragraph2);

socket.on('ShowSensorData', (data) => {
    // alert('pokaż dane');
    parragraph2.innerHTML = `a = ${data.alpha}, b = ${data.beta}, g = ${data.gamma}<br>
            accX = ${data.accX}, accY = ${data.accY}, accZ = ${data.accZ}`;
})

socket.on('StartCapturingSensorData', () => {
    console.log('Received request to start capturing sensor data from computer');
    sensorHandler.startCapturing();
});

socket.on('StopCapturingSensorData', () => {
    sensorHandler.stopCapturing();
})

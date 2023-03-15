const socket = io();

const messageForm = document.querySelector('#message-form')
const messageInput = document.querySelector('#input1');
const messages = document.querySelector('#messages');

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    //  new message element
    const newMessage = messages.lastElementChild;

    // height of message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    // visible margin
    const visibleHeight = messages.offsetHeightconst

    // height of message container
    const containerHeight = messages.scrollHeight;

    // how far have i scrolled
    const scrollOffset = messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }

}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, { username: message.username, message: message.text, createdAt: moment(message.createdAt).format('h:mm a') });
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (msg) => {
    const html = Mustache.render(locationTemplate, { username: msg.username, locationUrl: msg.url, createdAt: moment(msg.createdAt).format('h:mm a') });
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = e.target.elements.input1.value;
    socket.emit('message', message, () => {
        console.log('Message delivered!');
    });
    messageInput.value = '';
    messageInput.focus();
});

document.querySelector('#send-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Cannot share location!');
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const myLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        }
        socket.emit('sendLocation', myLocation, (msg) => {
            console.log(msg);
        });
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});

socket.on('sendUsers', ({ users, room }) => {
    const html = Mustache.render(sidebarTemplate, { room, users })
    document.querySelector('#sidebar').innerHTML = html;
})
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { generateMessage, generateLocationMessage } = require('./utils/message');
const {
    getUser,
    getUsersInRoom,
    addUser,
    removeUser,
    listUsers
} = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = new Server(server)


// paths 
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '../public')

// setup static directory path
app.use(express.static(publicDir));


io.on('connection', (socket) => {
    console.log('new connection made!');

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));

        const users = getUsersInRoom(user.room);
        io.to(user.room).emit('sendUsers', { users, room: user.room })
        callback();
    })


    socket.on('message', (message, callback) => {
        const user = getUser(socket.id);

        if (!user) {
            return
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
            const users = getUsersInRoom(user.room);
            io.to(user.room).emit('sendUsers', { users, room: user.room })
        }
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);

        if (!user) {
            return
        }

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${location.latitude},${location.longitude}`));
        callback('Location shared!');
    })
})








server.listen(port, () => {
    console.log('server running on 3000');
})
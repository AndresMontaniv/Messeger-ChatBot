
const socketController = async (socket = new Socket(), io) => {
    socket.on('new-user', () => {
        console.log('algo llego al controller');
        socket.broadcast.emit('user-connected');
    });

}

module.exports = {
    socketController
}


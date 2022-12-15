
const socketController = async( socket = new Socket(), io ) => {

    socket.on('new-user',()=> {
        socket.broadcast.emit( 'user-connected');
    });

}

module.exports = {
    socketController
}


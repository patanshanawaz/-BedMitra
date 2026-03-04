
const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on('join_hospital', (hospitalId) => { socket.join(`hospital_${hospitalId}`); });
    socket.on('join_city', (cityId) => { socket.join(`city_${cityId}`); });
    socket.on('disconnect', () => { console.log(`Socket disconnected: ${socket.id}`); });
  });
};
module.exports = socketHandler;

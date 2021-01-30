import Ws from 'App/Services/Ws'

Ws.start((socket) => {
  socket.on('room-join', async (data: { unique_uuid: string }) => {
    socket.join(data.unique_uuid)
    Ws.io.to(data.unique_uuid).emit('room-joined', data.unique_uuid)
  })
})

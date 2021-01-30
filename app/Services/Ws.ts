import socketIo from 'socket.io'
import Server from '@ioc:Adonis/Core/Server'

class Ws {
  public isReady = false
  public io: socketIo.Server

  public start(callback: (socket: socketIo.Socket) => void) {
    this.io = socketIo(Server.instance!)
    this.io.on('connection', callback)
    this.isReady = true
  }

  public getClients(namespace?: string, room?: string): Promise<string[]> {
    let namespaceInstance = this.io.of(namespace || '/')
    if (room) {
      namespaceInstance = namespaceInstance.in(room)
    }

    return new Promise((resolve, reject) => {
      namespaceInstance.clients((error: Error, clients: string[]) => {
        if (error) {
          reject(error)
        } else {
          resolve(clients)
        }
      })
    })
  }
}

/**
 * This makes our service a singleton
 */
export default new Ws()

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Ws from 'App/Services/Ws'

export default class CallbacksController {
  public donationDone({ request }: HttpContextContract) {
    //TODO
    const { uniqueUuid } = request.only(['uniqueUuid'])
    Ws.io.to(uniqueUuid).emit('donation-done', { amount: 1, donor: 'toto', message: 'hello world!' })
  }
}

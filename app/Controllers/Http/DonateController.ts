import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'

export default class HomeController {
  public async index({ view, response, params }: HttpContextContract) {
    const username = params.username

    const user = await User.query().where('name', username).first()
    if (user) {
      return view.render('donate')
    }
    return response.redirect('/')
  }

  public async createInvoice({ request, response }: HttpContextContract) {
    const BTCPAY_URL: string = Env.get('BTCPAY_URL')!.toString()
    const BTCPAY_AUTH: string = Env.get('BTCPAY_AUTH')!.toString()
    console.log(BTCPAY_URL, BTCPAY_AUTH)
    const { amount, currency, message, donor } = request.only([
      'amount',
      'currency',
      'message',
      'donor',
    ])
    const axiosClient = axios.create({
      baseURL: BTCPAY_URL,
      timeout: 5000,
      responseType: 'json',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': BTCPAY_AUTH,
      },
    })

    const invoiceCreation = {
      price: amount,
      currency: currency,
      // 'orderId': 'something',
      notificationUrl: 'https://localhost:3333/donation-done',
    }

    const result = await axiosClient.post('/invoices', invoiceCreation)

    response.send(result.data)
  }
}

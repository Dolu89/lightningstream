import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import BtcpayService from 'App/Services/BtcpayService'

export default class HomeController {
  public async index({ view, response, params }: HttpContextContract) {
    const username = params.username

    const user = await User.query().where('name', username).first()
    const wallet = await user!.related('wallet').query().firstOrFail()
    if (user) {
      return view.render('donate', { user: { id: user.id, name: user.name }, btcPayUrl: wallet.btcpayUrl })
    }
    return response.redirect('/')
  }

  public async createInvoice({ request, response }: HttpContextContract) {
    const { userId, amount, currency, message, donor } = request.only(['amount', 'currency', 'message', 'donor', 'userId'])
    let user = await User.findOrFail(userId)
    const wallet = await user.related('wallet').query().firstOrFail()
    const invoiceResult = await BtcpayService.createInvoice(wallet.btcpayUrl, wallet.btcpayApiKey, wallet.btcpayStoreId, currency, amount)
    const invoicePaymentMethod = await BtcpayService.getInvoicePaymentMethod(wallet.btcpayUrl, wallet.btcpayApiKey, wallet.btcpayStoreId, invoiceResult.id)
    await user.related('invoices').create({
      amount: Math.round(invoicePaymentMethod[0].amount * 100000000),
      btcpayInvoiceId: invoiceResult.id,
      donor,
      message,
      isPaid: false,
    })
    response.json(invoiceResult)
  }
}

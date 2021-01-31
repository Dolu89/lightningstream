import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Ws from 'App/Services/Ws'
import crypto from 'crypto'
import Invoice from 'App/Models/Invoice'
import User from 'App/Models/User'
import Wallet from 'App/Models/Wallet'

export default class CallbacksController {
  public async donationDone({ request, response }: HttpContextContract) {
    const invoiceId = request.input('invoiceId')
    let invoice = await Invoice.findByOrFail('btcpay_invoice_id', invoiceId)
    const user = await User.findOrFail(invoice.userId)
    const wallet = await Wallet.findByOrFail('userId', user.id)

    const body = JSON.stringify(request.all())

    const sig = request.header('BTCPay-Sig')
    const hmac = crypto.createHmac('sha256', wallet.btcpayWebhookSecret)
    const digest = Buffer.from('sha256=' + hmac.update(body).digest('hex'), 'utf8')
    const checksum = Buffer.from(sig!, 'utf8')
    if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
      invoice.isPaid = true
      await invoice.save()
      const uniqueUuid = user.uniqueUuid
      Ws.io.to(uniqueUuid).emit('donation-done', { amount: invoice.amount, donor: invoice.donor, message: invoice.message })
    } else {
      console.error('ERROR')
    }
    response.send('ok')
  }
}

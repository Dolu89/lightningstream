import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Invoice from 'App/Models/Invoice'

export default class LiveEventsController {
  public async index({ view, auth }: HttpContextContract) {
    const user = auth.user!
    const invoices = await Invoice.query().select(['id', 'donor', 'message', 'createdAt', 'amount']).where('userId', user.id).andWhere('isPaid', true).orderBy('id', 'desc')
    return view.render('live-events/index', {
      unique_uuid: user.uniqueUuid,
      invoices: invoices.map((i: Invoice) => i.serialize()),
    })
  }
}

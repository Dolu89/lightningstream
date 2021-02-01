import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import BtcpayService from 'App/Services/BtcpayService'

export default class WalletsController {
  public async index({ view, auth }: HttpContextContract) {
    const wallet = await auth.user?.related('wallet').query().first()
    let data = {}
    if (wallet) {
      const { data: onChainPaymentResult } = await axios.get(`${wallet.btcpayUrl}/api/v1/stores/${wallet.btcpayStoreId}/payment-methods/OnChain`, {
        headers: { Authorization: `token ${wallet.btcpayApiKey}` },
      })
      return view.render('wallets/edit', {
        wallet: { ...wallet.toJSON(), xpub: onChainPaymentResult.find((e) => e.enabled) },
      })
    }
    return view.render('wallets/index', data)
  }

  public async update({ request, auth, session, response }: HttpContextContract) {
    const user = auth.user
  }

  public async create({ request, session, response, auth }: HttpContextContract) {
    const user = auth.user
    const custominstance = request.input('custominstance')

    // Use the BTCPay instance we provide
    if (custominstance === 'false') {
      const walletSchema = schema.create({
        xpub: schema.string(),
        lnuri: schema.string.optional(),
        password: schema.string({}, [rules.password({ userPassword: user?.password! })]),
      })

      await request.validate({
        schema: walletSchema,
        cacheKey: request.url(),
        messages: {
          'xpub.required': 'XPUB is required',
          'password.required': 'Your password is required to create your wallet',
        },
      })

      /*
        Waiting this PR https://github.com/btcpayserver/btcpayserver/pull/2208
        to update lightning node URI
      */
      // @ts-ignore
      const { password, xpub, lnuri } = request.only(['password', 'xpub', 'lnuri'])

      const wallet = await user?.related('wallet').query().first()

      if (!wallet) {
        const btcPayUrl = Env.get('BTCPAY_URL')
        const email = user?.email!

        let apiKeyResult
        let storeResult
        try {
          // Create user
          await BtcpayService.createOrGetUser(btcPayUrl, email, password)

          // Create API Key
          apiKeyResult = await BtcpayService.createApiKey(btcPayUrl, email, password)

          // Create store
          storeResult = await BtcpayService.createStore(btcPayUrl, apiKeyResult.apiKey)

          // Create Webhook
          const callbackUrl = `${Env.get('APP_URL')}/donation-done`
          const webhookResult = await BtcpayService.createWebhook(btcPayUrl, apiKeyResult.apiKey, storeResult.id, callbackUrl)

          // Update LN wallet with lnuri (PR https://github.com/btcpayserver/btcpayserver/pull/2208)

          // Update BTC wallet with XPUB
          await BtcpayService.updateOnChainPayment(btcPayUrl, apiKeyResult.apiKey, storeResult.id, xpub)

          await user?.related('wallet').create({
            btcpayCustomInstance: false,
            btcpayStoreId: storeResult.id,
            btcpayApiKey: apiKeyResult.apiKey,
            btcpayUrl: btcPayUrl,
            btcpayWebhookId: webhookResult.id,
            btcpayWebhookSecret: webhookResult.secret,
          })
        } catch (e) {
          if (storeResult) {
            await BtcpayService.deleteStore(btcPayUrl, apiKeyResult.apiKey, storeResult.id)
          }
          if (apiKeyResult) {
            await BtcpayService.revokeApiKey(btcPayUrl, apiKeyResult.apiKey)
          }
          session.flash('error', 'An error occurred while creating your wallet.')
          return response.redirect('back')
        }
      }
    }

    session.flash('success', 'Wallet created')
    response.redirect('back')
  }
}

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'

export default class WalletsController {
  public async index({ view, auth }: HttpContextContract) {
    const wallet = await auth.user?.related('wallet').query().first()
    let data = {}
    if (wallet) {
      data = {
        walletExists: {
          btcPayUrl: wallet.btcpayUrl,
        },
      }
    }
    return view.render('wallets/index', data)
  }

  public async createOrUpdate({ request, session, response, auth }: HttpContextContract) {
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
        },
      })

      /*
        Waiting this PR https://github.com/btcpayserver/btcpayserver/pull/2208
        to update lightning node URI
      */
      const { password, xpub, lnuri } = request.only(['password', 'xpub', 'lnuri'])

      const wallet = await user?.related('wallet').query().first()

      if (!wallet) {
        const btcPayUrl = Env.get('BTCPAY_URL')
        const email = user?.email
        // Create user
        await axios.post(`${btcPayUrl}/api/v1/users`, {
          email,
          password,
          isAdministrator: false,
        })
        // Create API Key
        const { data: apiKeyResult } = await axios.post(
          `${btcPayUrl}/api/v1/api-keys`,
          {
            label: 'LStream',
            permissions: [
              'btcpay.store.canmodifystoresettings',
              'btcpay.server.canuseinternallightningnode',
            ],
          },
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${email}:${password}`, 'utf-8').toString(
                'base64'
              )}`,
            },
          }
        )

        // Create store
        const { data: storeResult } = await axios.post(
          `${btcPayUrl}/api/v1/stores`,
          {
            name: 'LStream',
            website: '',
            invoiceExpiration: 900,
            monitoringExpiration: 3600,
            speedPolicy: 'HighSpeed',
            lightningDescriptionTemplate: '',
            paymentTolerance: 0,
            anyoneCanCreateInvoice: false,
            requiresRefundEmail: false,
            lightningAmountInSatoshi: false,
            lightningPrivateRouteHints: false,
            onChainWithLnInvoiceFallback: false,
            redirectAutomatically: false,
            showRecommendedFee: true,
            recommendedFeeBlockTarget: 1,
            defaultLang: 'en',
            customLogo: '',
            customCSS: '',
            htmlTitle: '',
            networkFeeMode: 'Never',
            payJoinEnabled: false,
            defaultPaymentMethod: 'BTC',
          },
          {
            headers: {
              Authorization: `token ${apiKeyResult.apiKey}`,
            },
          }
        )

        // Update BTC wallet with XPUB
        await axios.put(
          `${btcPayUrl}/api/v1/stores/${storeResult.id}/payment-methods/OnChain/BTC`,
          {
            enabled: 'true',
            cryptoCode: 'BTC',
            derivationScheme: xpub,
            label: 'Test wallet',
          },
          {
            headers: {
              Authorization: `token ${apiKeyResult.apiKey}`,
            },
          }
        )

        await user?.related('wallet').create({
          btcpayCustomInstance: false,
          btcpayStoreId: storeResult.id,
          btcpayApiKey: apiKeyResult.apiKey,
          btcpayUrl: btcPayUrl,
        })
      }
    }

    session.flash('success', 'Wallet created')
    response.redirect('back')
  }
}

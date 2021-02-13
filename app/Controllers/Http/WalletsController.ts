import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import BtcpayService from 'App/Services/BtcpayService'

export default class WalletsController {
  public async index({ view, auth }: HttpContextContract) {
    const wallet = await auth.user?.related('wallet').query().first()

    if (wallet && wallet.step === 'finished') {
      const { data: onChainPaymentResult } = await axios.get(`${wallet.btcpayUrl}/api/v1/stores/${wallet.btcpayStoreId}/payment-methods/OnChain`, {
        headers: { Authorization: `token ${wallet.btcpayApiKey}` },
      })
      return view.render('wallets/edit', {
        wallet: { ...wallet.toJSON(), xpub: onChainPaymentResult.find((e) => e.enabled) },
      })
    }

    const step = wallet?.step ? wallet.step : 'btcpay'

    //Temp : Remove when LN wallet is editable with Greenfield
    if (step === 'lnwallet') {
      return view.render('wallets/create', {
        step,
        btcPayUrl: wallet?.btcpayUrl,
        btcPayStoreId: wallet?.btcpayStoreId,
      })
    }

    return view.render('wallets/create', {
      step,
    })
  }

  public async createBtcPayAccount({ request, auth, session, response }: HttpContextContract) {
    const user = auth.user
    const customInstance = request.input('customInstance')

    // Use the BTCPay instance we provide
    if (customInstance === 'false') {
      const walletSchema = schema.create({
        password: schema.string({}, [rules.password({ userPassword: user?.password! })]),
      })

      await request.validate({
        schema: walletSchema,
        messages: {
          'password.required': 'Your password is required to create your wallet',
        },
      })

      /*
        Waiting this PR https://github.com/btcpayserver/btcpayserver/pull/2208
        to update lightning node URI
      */
      // @ts-ignore
      const { password } = request.only(['password'])

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

          await user?.related('wallet').create({
            btcpayCustomInstance: false,
            btcpayStoreId: storeResult.id,
            btcpayApiKey: apiKeyResult.apiKey,
            btcpayUrl: btcPayUrl,
            btcpayWebhookId: webhookResult.id,
            btcpayWebhookSecret: webhookResult.secret,
            step: 'btcwallet',
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
        return response.redirect('back')
      }
    }
  }

  public async updateOnChainWallet({ request, auth, response, view }: HttpContextContract) {
    const user = auth.user!
    await user.preload('wallet')
    const { skip, verify, confirm } = request.only(['skip', 'verify', 'confirm'])

    if (skip === 'true') {
      user.wallet.step = 'lnwallet'
      await user.wallet.save()
      return response.redirect('back')
    } else if (verify === 'true') {
      const { xpub, keyPath, fingerprint } = request.only(['xpub', 'keyPath', 'fingerprint'])
      const addresses = await BtcpayService.previewOnChainAddresses(user.wallet.btcpayUrl, user.wallet.btcpayApiKey, user.wallet.btcpayStoreId, xpub, keyPath, fingerprint)
      return view.render('wallets/create', {
        step: 'btcwallet-verify',
        addresses: addresses.addresses,
        xpub,
        keyPath,
        fingerprint,
      })
    } else if (confirm === 'true') {
      const { xpub, keyPath, fingerprint } = request.only(['xpub', 'keyPath', 'fingerprint'])
      const walletSchema = schema.create({
        xpub: schema.string(),
      })

      await request.validate({
        schema: walletSchema,
        cacheKey: request.url(),
        messages: {
          'xpub.required': 'XPUB is required',
        },
      })

      await BtcpayService.updateOnChainPayment(user.wallet.btcpayUrl, user.wallet.btcpayApiKey, user.wallet.btcpayStoreId, xpub, keyPath, fingerprint)
      user.wallet.step = 'lnwallet'
      await user.wallet.save()
      return response.redirect('/wallets')
    }
  }

  public async updateLnWallet({ response, auth }: HttpContextContract) {
    const user = auth.user!
    await user?.preload('wallet')
    /*
      Waiting this PR https://github.com/btcpayserver/btcpayserver/pull/2208
      to update lightning node
    */
    user.wallet.step = 'finished'
    await user.wallet.save()
    response.redirect().back()
  }
}

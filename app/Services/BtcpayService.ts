import axios from 'axios'

class BtcpayService {
  public async createOrGetUser(btcPayUrl: string, email: string, password: string, isAdministrator: boolean = false) {
    //Try to get the account
    try {
      const { data: userGetResult } = await axios.get(`${btcPayUrl}/api/v1/users/me`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${email}:${password}`, 'utf-8').toString('base64')}`,
        },
      })
      return userGetResult
    } catch (e) {
      console.log('Create new user on btcpay')
      //Create the account
      const { data: userCreatedResult } = await axios.post(`${btcPayUrl}/api/v1/users`, {
        email,
        password,
        isAdministrator,
      })
      return userCreatedResult
    }
  }

  public async createApiKey(btcPayUrl: string, email: string, password: string) {
    const { data: apiKeyResult } = await axios.post(
      `${btcPayUrl}/api/v1/api-keys`,
      {
        label: 'LStream',
        permissions: ['btcpay.store.canmodifystoresettings', 'btcpay.store.canuselightningnode', 'btcpay.store.webhooks.canmodifywebhooks', 'btcpay.store.canviewinvoices'],
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${email}:${password}`, 'utf-8').toString('base64')}`,
        },
      }
    )
    return apiKeyResult
  }

  public async createStore(btcPayUrl: string, apiKey: string) {
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
          Authorization: `token ${apiKey}`,
        },
      }
    )
    return storeResult
  }

  public async previewOnChainAddresses(btcPayUrl: string, apiKey: string, storeId: string, xpub: string, keyPath: string, fingerprint: string) {
    const { data: resultAddresses } = await axios.post(
      `${btcPayUrl}/api/v1/stores/${storeId}/payment-methods/OnChain/BTC/preview?offset=0&amount=10`,
      {
        derivationScheme: xpub,
        accountKeyPath: `${fingerprint}/${keyPath}`,
      },
      {
        headers: {
          Authorization: `token ${apiKey}`,
        },
      }
    )
    return resultAddresses
  }

  public async updateOnChainPayment(btcPayUrl: string, apiKey: string, storeId: string, xpub: string, keyPath: string, fingerprint: string) {
    await axios.put(
      `${btcPayUrl}/api/v1/stores/${storeId}/payment-methods/OnChain/BTC`,
      {
        enabled: 'true',
        cryptoCode: 'BTC',
        derivationScheme: xpub,
        label: 'LStream on chain wallet',
        accountKeyPath: `${fingerprint}/${keyPath}`,
      },
      {
        headers: {
          Authorization: `token ${apiKey}`,
        },
      }
    )
  }

  public async createInvoice(btcPayUrl: string, apiKey: string, storeId: string, currency: string, amount: number) {
    const { data: invoiceResult } = await axios.post(
      `${btcPayUrl}/api/v1/stores/${storeId}/invoices`,
      {
        amount,
        currency,
        metadata: {},
        checkout: {
          speedPolicy: 'LowSpeed',
          expirationMinutes: 10,
          monitoringMinutes: 0,
          paymentTolerance: 0,
          notificationUrl: '',
          defaultLanguage: 'en',
        },
      },
      {
        headers: { Authorization: `token ${apiKey}` },
      }
    )
    return invoiceResult
  }

  public async revokeApiKey(btcPayUrl: string, apiKey: string) {
    await axios.delete(`${btcPayUrl}/api/v1/api-keys/current`, { headers: { Authorization: `token ${apiKey}` } })
  }

  public async deleteStore(btcPayUrl: string, apiKey: string, storeId: string) {
    await axios.delete(`${btcPayUrl}/api/v1/stores/${storeId}`, { headers: { Authorization: `token ${apiKey}` } })
  }

  public async createWebhook(btcPayUrl: string, apiKey: string, storeId: string, callbackUrl: string) {
    const { data: webhook } = await axios.post(
      `${btcPayUrl}/api/v1/stores/${storeId}/webhooks`,
      {
        id: '1',
        enabled: true,
        automaticRedelivery: true,
        url: callbackUrl,
        authorizedEvents: {
          everything: false,
          specificEvents: ['InvoiceReceivedPayment'],
        },
      },
      { headers: { Authorization: `token ${apiKey}` } }
    )
    return webhook
  }

  public async getInvoicePaymentMethod(btcPayUrl: string, apiKey: string, storeId: string, invoiceId) {
    const { data: invoicePaymentMethod } = await axios.get(`${btcPayUrl}/api/v1/stores/${storeId}/invoices/${invoiceId}/payment-methods`, { headers: { Authorization: `token ${apiKey}` } })
    return invoicePaymentMethod
  }
}

export default new BtcpayService()

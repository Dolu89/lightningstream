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
        permissions: ['btcpay.store.canmodifystoresettings', 'btcpay.server.canuseinternallightningnode'],
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

  public async updateOnChainPayment(btcPayUrl: string, apiKey: string, storeId: string, xpub: string) {
    await axios.put(
      `${btcPayUrl}/api/v1/stores/${storeId}/payment-methods/OnChain/BTC`,
      {
        enabled: 'true',
        cryptoCode: 'BTC',
        derivationScheme: xpub,
        label: 'LStream on chain wallet',
      },
      {
        headers: {
          Authorization: `token ${apiKey}`,
        },
      }
    )
  }

  public async revokeApiKey(btcPayUrl: string, apiKey: string) {
    await axios.delete(`${btcPayUrl}/api/v1/api-keys/current`, { headers: { Authorization: `token ${apiKey}` } })
  }

  public async deleteStore(btcPayUrl: string, apiKey: string, storeId: string) {
    await axios.delete(`${btcPayUrl}/api/v1/stores/${storeId}`, { headers: { Authorization: `token ${apiKey}` } })
  }
}

export default new BtcpayService()

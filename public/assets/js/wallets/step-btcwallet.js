var app = new Vue({
  el: '#app',
  data: {
    skip: false,
    xpub: '',
    keyPath: ``,
    fingerPrint: '',
    modalHW: {
      isActive: false,
      step: '',
      vaultNotDetected: false,

      deviceNotFound: false,
      deviceLocked: false,

      xpub: '',
      fingerPrint: '',
      keyPath: '',
      addressType: 'segwit',
      account: 0,
    },
  },
  methods: {
    async authorizeVault() {
      this.modalHW.vaultNotDetected = false
      this.modalHW.step = 'authorize-vault'
      this.modalHW.isActive = true
      try {
        await axios.get('http://127.0.0.1:65092/hwi-bridge/v1/request-permission')
        await this.fetchDevice()
      } catch (e) {
        this.modalHW.vaultNotDetected = true
      }
    },
    async fetchDevice() {
      this.modalHW.fetchDeviceFailed = false
      this.modalHW.step = 'fetch-device'
      try {
        const fetchDeviceResult = await axios.post(
          'http://127.0.0.1:65092/hwi-bridge/v1',
          {
            params: ['--testnet', 'enumerate'],
          },
          {
            headers: {
              'Content-Type': 'text/plain;charset=UTF-8',
            },
          }
        )
        if (fetchDeviceResult.data[0].code) {
          //TODO device locked
        }

        //Device detected and unlocked
        this.modalHW.step = 'select-account'
        this.modalHW.fingerPrint = fetchDeviceResult.data[0].fingerprint
      } catch (e) {
        this.modalHW.fetchDeviceFailed = true
      }
    },
    async getXPub() {
      this.modalHW.step = 'get-xpub'
      let path = 'm/[ADDRESS_TYPE]h/[NETWORK]h/[ACCOUNT]h'
      let keyPath = `[ADDRESS_TYPE]'/[NETWORK]'/[ACCOUNT]'`
      let xpubSuffix = ''

      // Build path
      if (this.modalHW.addressType === 'segwit') {
        path = path.replace('[ADDRESS_TYPE]', '84')
        keyPath = keyPath.replace('[ADDRESS_TYPE]', '84')
      } else if (this.modalHW.addressType === 'segwitWrapped') {
        path = path.replace('[ADDRESS_TYPE]', '49')
        keyPath = keyPath.replace('[ADDRESS_TYPE]', '49')
        xpubSuffix = '-[p2sh]'
      } else {
        path = path.replace('[ADDRESS_TYPE]', '44')
        keyPath = keyPath.replace('[ADDRESS_TYPE]', '44')
        xpubSuffix = '-[legacy]'
      }

      if (window.bitcoinNetwork === 'mainnet') {
        path = path.replace('[NETWORK]', '0')
        keyPath = keyPath.replace('[NETWORK]', '0')
      } else {
        path = path.replace('[NETWORK]', '1')
        keyPath = keyPath.replace('[NETWORK]', '1')
      }

      path = path.replace('[ACCOUNT]', this.modalHW.account.toString())
      keyPath = keyPath.replace('[ACCOUNT]', this.modalHW.account.toString())
      this.modalHW.keyPath = keyPath

      try {
        const fetchAccountResult = await axios.post(
          'http://127.0.0.1:65092/hwi-bridge/v1',
          {
            params: ['--testnet', '--fingerprint', this.modalHW.fingerPrint, 'getxpub', path],
          },
          {
            headers: {
              'Content-Type': 'text/plain;charset=UTF-8',
            },
          }
        )
        this.xpub = `${fetchAccountResult.data.xpub}${xpubSuffix}`
        this.fingerPrint = this.modalHW.fingerPrint
        this.keyPath = this.modalHW.keyPath
        this.isSourceVault = true
        this.modalHW.isActive = false
      } catch (e) {
        //TODO
      }
    },
  },
})

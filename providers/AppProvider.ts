import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import Env from '@ioc:Adonis/Core/Env'

export default class AppProvider {
  public static needsApplication = true

  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    const View = (await import('@ioc:Adonis/Core/View')).default
    View.global('bitcoinNetwork', () => {
      return Env.get('BITCOIN_NETWORK').toLowerCase()
    })
  }

  public async ready() {
    const App = await import('@ioc:Adonis/Core/Application')

    /**
     * Only import socket file, when environment is `web`. In other
     * words do not import during ace commands.
     */
    if (App.default.environment === 'web') {
      await import('../start/socket')
    }
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}

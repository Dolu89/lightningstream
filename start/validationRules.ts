/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import { validator } from '@ioc:Adonis/Core/Validator'
import Hash from '@ioc:Adonis/Core/Hash'

validator.rule(
  'password',
  async (value, [{ userPassword }], { pointer, errorReporter, arrayExpressionPointer }) => {
    /**
     * Skip validation when value is not a string. The string
     * schema rule will handle it
     */
    if (typeof value !== 'string') {
      return
    }

    const match = await Hash.verify(userPassword, value)

    /**
     * Report error when password does not match
     */
    if (!match) {
      errorReporter.report(pointer, 'password', 'Password verification failed', arrayExpressionPointer)
    }
    return
  },
  () => {
    return {
      async: true,
    }
  }
)

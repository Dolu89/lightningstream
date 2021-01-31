import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Env from '@ioc:Adonis/Core/Env'

import AlertBoxConfiguration from 'App/Models/AlertBoxConfiguration'

import { v2 as cloudinary } from 'cloudinary'
import User from 'App/Models/User'

export default class AlertBoxConfigurationsController {
  public async index({ auth, view }: HttpContextContract) {
    const user = auth.user

    const alertBoxConfig = await AlertBoxConfiguration.query().where({ is_active: true, user_id: user?.id }).firstOrFail()
    const alertBoxUrl: string = `${Env.get('APP_URL')}/alert-box/${user?.uniqueUuid}`
    return view.render('alertbox/configuration', { ...alertBoxConfig.toJSON(), alertBoxUrl })
  }

  public async update({ request, auth, view }: HttpContextContract) {
    const postsSchema = schema.create({
      template: schema.string({ trim: true }),
      duration: schema.number([rules.unsigned()]),
      showMessage: schema.boolean(),
    })

    await request.validate({
      schema: postsSchema,
      messages: {
        'duration.unsigned': 'Duration must be contains between 1 and 30',
      },
    })

    let { template, duration, showMessage } = request.only(['template', 'duration', 'showMessage'])

    const image = request.file('image')
    const sound = request.file('sound')

    const user = auth.user
    const alertBoxConfig = await AlertBoxConfiguration.query().where({ is_active: true, user_id: user?.id }).firstOrFail()

    if (duration <= 0) {
      duration = 1
    }
    if (duration > 30) {
      duration = 30
    }

    alertBoxConfig.merge({
      template,
      duration,
      show_message: showMessage,
    })

    if (image) {
      const imageSchema = schema.create({
        image: schema.file({
          size: '500kb',
          extnames: ['jpg', 'png', 'jpeg', 'gif'],
        }),
      })
      await request.validate({
        schema: imageSchema,
        messages: {
          'image.size': 'The file size must be under {{ options.size }}',
          'image.extnames': 'The file must have one of {{ options.extnames }} extension names',
        },
      })
    }

    if (sound) {
      const soundSchema = schema.create({
        sound: schema.file({
          size: '1mb',
          extnames: ['mp3'],
        }),
      })
      await request.validate({
        schema: soundSchema,
        messages: {
          'image.size': 'The file size must be under {{ options.size }}',
          'image.extnames': 'The file must have one of {{ options.extnames }} extension names',
        },
      })
    }

    if (image && image.tmpPath) {
      const uploaded = await cloudinary.uploader.upload(image.tmpPath, {
        public_id: `${Env.get('CLOUDINARY_FOLDER')}/${user?.id}-alertbox-image`,
        resource_type: 'image',
      })
      alertBoxConfig.imageUrl = uploaded.secure_url
    }

    if (sound && sound.tmpPath) {
      const uploaded = await cloudinary.uploader.upload(sound.tmpPath, {
        public_id: `${Env.get('CLOUDINARY_FOLDER')}/${user?.id}-alertbox-sound`,
        resource_type: 'video',
      })
      alertBoxConfig.soundUrl = uploaded.secure_url
    }

    alertBoxConfig.save()
    const alertBoxUrl: string = `${Env.get('APP_URL')}/alert-box/${user?.uniqueUuid}`

    return view.render('alertbox/configuration', { ...alertBoxConfig.toJSON(), alertBoxUrl })
  }

  public async public({ params, view }: HttpContextContract) {
    const uniqueUuid = params['uniqueUuid']

    const user = await User.query().where({ uniqueUuid: uniqueUuid }).firstOrFail()

    const activeAlertBoxConfiguration = await user.related('alertBoxConfigurations').query().where('isActive', true).firstOrFail()

    return view.render('alertbox/public', {
      ...activeAlertBoxConfiguration.toJSON(),
      unique_uuid: uniqueUuid,
      test: activeAlertBoxConfiguration.toJSON(),
    })
  }
}

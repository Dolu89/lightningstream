import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class HomeController {
  public home({ view }: HttpContextContract) {
    return view.render('home')
  }

  public homeAuthenticated({ view }: HttpContextContract) {
    return view.render('dashboard')
  }
}

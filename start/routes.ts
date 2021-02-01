/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes/index.ts` as follows
|
| import './cart'
| import './customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', 'HomeController.home')

Route.get('alert-box/:uniqueUuid', 'AlertBoxConfigurationsController.public')
Route.post('/donate/create-invoice', 'DonateController.createInvoice')

Route.group(() => {
  Route.get('dashboard', 'HomeController.homeAuthenticated')

  Route.group(() => {
    Route.get('/', 'AlertBoxConfigurationsController.index')
    Route.post('/', 'AlertBoxConfigurationsController.update')
  }).prefix('alert-box')

  Route.group(() => {
    Route.get('/', 'WalletsController.index')
    Route.post('/', 'WalletsController.create')
    Route.put('/', 'WalletsController.update')
  }).prefix('wallets')
}).middleware('auth')

Route.on('register').render('auth/register')
Route.post('register', 'AuthController.register')
Route.on('login').render('auth/login')
Route.post('/login', 'AuthController.login')
Route.get('/logout', 'AuthController.logout')

Route.post('donation-done', 'CallbacksController.donationDone')
Route.get('/:username', 'DonateController.index')

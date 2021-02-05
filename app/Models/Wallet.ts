import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column()
  public btcpayCustomInstance: boolean

  @column()
  public btcpayUrl: string

  @column()
  public btcpayApiKey: string

  @column()
  public btcpayStoreId: string

  @column()
  public btcpayWebhookId: string

  @column()
  public btcpayWebhookSecret: string

  @column()
  public userId: number

  @column()
  public step: string

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>
}

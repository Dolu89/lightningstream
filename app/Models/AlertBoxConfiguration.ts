import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class AlertBoxConfiguration extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column()
  public userId: number

  @column()
  public isActive: boolean

  @column()
  public template: string

  @column()
  public duration: number

  @column()
  public show_message: boolean

  @column()
  public imageUrl: string

  @column()
  public soundUrl: string

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>
}

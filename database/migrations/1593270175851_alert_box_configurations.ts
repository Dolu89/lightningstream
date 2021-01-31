import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AlertBoxes extends BaseSchema {
  protected tableName = 'alert_box_configurations'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.timestamps(true)
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.string('is_active').defaultTo(true)
      table.string('template').defaultTo('[donor] - [amount] sats')
      table.integer('duration').unsigned().defaultTo('5')
      table.boolean('show_message').defaultTo(true)
      table.string('sound_url').defaultTo('https://res.cloudinary.com/lightningstream-io/video/upload/v1593270519/default-alertbox-sound.mp3')
      table.string('image_url').defaultTo('https://res.cloudinary.com/lightningstream-io/image/upload/v1593270454/default-alertbox-image.gif')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}

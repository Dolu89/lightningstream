import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Wallets extends BaseSchema {
  protected tableName = 'wallets'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.timestamps(true)
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.boolean('btcpay_custom_instance')
      table.string('btcpay_url')
      table.string('btcpay_api_key')
      table.string('btcpay_store_id')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}

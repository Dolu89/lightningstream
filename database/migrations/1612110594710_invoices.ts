import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Invoices extends BaseSchema {
  protected tableName = 'invoices'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.timestamps(true)
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.string('donor')
      table.string('message')
      table.string('btcpay_invoice_id')
      table.integer('amount')
      table.boolean('is_paid')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}

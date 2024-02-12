class ChangeStripeInvoicesPrimaryKey < ActiveRecord::Migration[6.1]

  def up
    change_column :stripe_invoices, :stripe_invoice_id, :string, unique: true
    add_column :stripe_invoices, :id, :primary_key, :null => false, :auto_increment => true
  end

  def down
    change_column :stripe_invoices, :stripe_invoice_id, :string, unique: false
    add_index :stripe_invoices, :stripe_invoice_id, unique: true
  end
end



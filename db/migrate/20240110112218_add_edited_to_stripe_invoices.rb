class AddEditedToStripeInvoices < ActiveRecord::Migration[6.1]
  def change
    add_column :stripe_invoices, :edited, :boolean
  end
end

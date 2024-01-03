class AddCreatedByPayerPaymentTermToDuePayments < ActiveRecord::Migration[6.1]
  def change
    add_column :due_payments, :created_by_payer_payment_term, :boolean, default: false
  end
end

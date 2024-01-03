class AddPaymentMethodToUserPaymentTerms < ActiveRecord::Migration[6.1]
  def change
    # add foreign key
    add_reference :payer_payment_terms, :payment_method, foreign_key: true, index: true, null: true
  end
end

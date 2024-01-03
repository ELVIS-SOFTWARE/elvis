class AddIndexToPaymentTerms < ActiveRecord::Migration[6.1]
  def change
    add_column :payment_terms, :index, :integer
  end
end

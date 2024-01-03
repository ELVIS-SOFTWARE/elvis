class CreatePayerPaymentTerms < ActiveRecord::Migration[6.1]
  def change
    create_table :payer_payment_terms do |t|
      t.integer :day_for_collection

      t.timestamps
      t.datetime "deleted_at"

      t.references :payer, null: false, foreign_key: { to_table: :users }
      t.references :payment_terms, null: false, foreign_key: true
      t.references :season, null: false, foreign_key: true
    end
  end
end

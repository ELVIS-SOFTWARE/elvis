class CreatePaymentTerms < ActiveRecord::Migration[6.1]
  def change
    create_table :payment_terms do |t|
      t.string :label
      t.integer :terms_number
      t.jsonb :collect_on_months
      t.jsonb :days_allowed_for_collection

      t.timestamps
      t.datetime "deleted_at"
    end
  end
end

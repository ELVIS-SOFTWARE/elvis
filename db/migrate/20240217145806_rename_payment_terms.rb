class RenamePaymentTerms < ActiveRecord::Migration[6.1]
  def up
    # modifications sur la table payment_terms
    rename_column :payment_terms, :terms_number, :payments_number
    rename_column :payment_terms, :collect_on_months, :payments_months
    rename_column :payment_terms, :days_allowed_for_collection, :available_payments_days
    rename_table :payment_terms, :payment_schedule_options

    # modifications sur la table payer_payment_terms
    rename_column :payer_payment_terms, :payment_terms_id, :payment_schedule_options_id

  end

  def down
    # modifications sur la table payment_schedule_options
    rename_column :payment_schedule_options, :payments_number, :terms_number
    rename_column :payment_schedule_options, :payments_months, :collect_on_months
    rename_column :payment_schedule_options, :available_payments_days, :days_allowed_for_collection
    rename_table :payment_schedule_options, :payment_terms

    # modifications sur la table payer_payment_terms
    rename_column :payer_payment_terms, :payment_schedule_options_id, :payment_terms_id
  end
end

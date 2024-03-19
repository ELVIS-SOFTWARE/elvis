class RenamePricingIdToPricingCategoryIdInPaymentScheduleOptions < ActiveRecord::Migration[6.1]
  def up
    remove_foreign_key :payment_schedule_options, column: :pricing_id if foreign_key_exists?(:payment_schedule_options, :pricings)

    if column_exists?(:payment_schedule_options, :pricing_id)
      rename_column :payment_schedule_options, :pricing_id, :pricing_category_id
      add_foreign_key :payment_schedule_options, :pricing_categories, column: :pricing_category_id
    else
      add_reference :payment_schedule_options, :pricing_category, foreign_key: true
    end
  end

  def down
    remove_foreign_key :payment_schedule_options, column: :pricing_category_id
    rename_column :payment_schedule_options, :pricing_category_id, :pricing_id
    add_foreign_key :payment_schedule_options, :pricings, column: :pricing_id if foreign_key_exists?(:payment_schedule_options, :pricing_categories)
  end
end

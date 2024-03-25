class RenamePricingIdToPricingCategoryIdInPaymentScheduleOptions < ActiveRecord::Migration[6.1]
  def up
    remove_foreign_key :payment_schedule_options, column: :pricing_id if foreign_key_exists?(:payment_schedule_options, :pricings)

    if column_exists?(:payment_schedule_options, :pricing_id)
      rename_column :payment_schedule_options, :pricing_id, :pricing_category_id

      execute("insert into pricing_categories (name, number_lessons, is_a_pack, created_at, updated_at) select label as name, 31 as number_lessons, false as is_a_pack, now() as created_at, now() as updated_at from pricings order by id asc") if table_exists?(:pricings)

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

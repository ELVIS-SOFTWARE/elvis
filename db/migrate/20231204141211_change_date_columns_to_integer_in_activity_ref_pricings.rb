class ChangeDateColumnsToIntegerInActivityRefPricings < ActiveRecord::Migration[6.1]
  def up
    remove_column :activity_ref_pricings, :from
    remove_column :activity_ref_pricings, :to

    add_column :activity_ref_pricings, :from, :bigint
    add_column :activity_ref_pricings, :to, :bigint
  end

  def down
    remove_column :activity_ref_pricings, :from
    remove_column :activity_ref_pricings, :to

    add_column :activity_ref_pricings, :from, :date
    add_column :activity_ref_pricings, :to, :date
  end
end

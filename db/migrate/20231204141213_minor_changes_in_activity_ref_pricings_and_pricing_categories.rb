class MinorChangesInActivityRefPricingsAndPricingCategories < ActiveRecord::Migration[6.1]
  def change
    change_column :pricing_categories, :number_lessons, :integer, null: true
    rename_column :activity_ref_pricings, :from, :from_season_id
    rename_column :activity_ref_pricings, :to, :to_season_id
  end
end

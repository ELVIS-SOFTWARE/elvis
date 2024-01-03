class AddForeignKeyToSeasonIdsInActivityRefPricings < ActiveRecord::Migration[6.1]
  def change
    add_foreign_key :activity_ref_pricings, :seasons, column: :from_season_id
    add_foreign_key :activity_ref_pricings, :seasons, column: :to_season_id
  end
end

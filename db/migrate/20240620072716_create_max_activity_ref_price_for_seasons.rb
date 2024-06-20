class CreateMaxActivityRefPriceForSeasons < ActiveRecord::Migration[6.1]
  def change
    create_table :max_activity_ref_price_for_seasons, primary_key: [:season_id, :target_id, :target_type] do |t|
      t.references :season, null: false, foreign_key: true
      t.references :target, null: false, polymorphic: true

      t.float :price, null: false, default: 0

      t.timestamps
    end
  end
end

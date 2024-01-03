class AddNextSeasonToSeasons < ActiveRecord::Migration[6.1]
  def change
    add_reference :seasons, :next_season, null: true, foreign_key: { to_table: :seasons}
  end
end

class RemoveIsNextFromSeasons < ActiveRecord::Migration[6.1]
  def change
    remove_column :seasons, :is_next, :boolean
  end
end

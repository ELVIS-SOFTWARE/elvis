class AddArchivedAtToFormules < ActiveRecord::Migration[6.1]
  def change
    add_column :formules, :archived_at, :datetime
  end
end

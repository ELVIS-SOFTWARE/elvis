class AddActivatedAtToPlugins < ActiveRecord::Migration[6.1]
  def change
    add_column :plugins, :activated_at, :datetime, null: true
  end
end

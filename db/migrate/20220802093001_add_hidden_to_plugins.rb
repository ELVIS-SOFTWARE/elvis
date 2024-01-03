class AddHiddenToPlugins < ActiveRecord::Migration[6.1]
  def change
    add_column :plugins, :hidden, :boolean, default: false, null: false
  end
end

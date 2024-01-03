class AddImageToPlugins < ActiveRecord::Migration[6.1]
  def change
    add_column :plugins, :image, :string
  end
end

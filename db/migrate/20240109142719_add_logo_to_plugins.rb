class AddLogoToPlugins < ActiveRecord::Migration[6.1]
  def change
    add_column :plugins, :logo, :string
  end
end

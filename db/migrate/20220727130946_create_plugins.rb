class CreatePlugins < ActiveRecord::Migration[4.2]
  def self.up
    create_table :plugins, force: true do |t|
      t.column "name", :string, limit: 30, default: "", null: false
      t.column "version", :string, null: true
      t.column "download_gem_link", :string, null: true
      t.timestamps
    end
  end

  def self.down
    drop_table :plugins
  end
end

class RemoveVersionFromPlugin < ActiveRecord::Migration[6.1]
  def self.up
    remove_column :plugins, :version
  end

  def self.down
    add_column :plugins, :version, :string
  end
end

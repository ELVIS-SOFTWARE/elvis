class ReplaceBranchToTagInPlugin < ActiveRecord::Migration[6.1]
  def self.up
    rename_column :plugins, :branch, :tag
  end

  def self.down
    rename_column :plugins, :tag, :branch
  end
end

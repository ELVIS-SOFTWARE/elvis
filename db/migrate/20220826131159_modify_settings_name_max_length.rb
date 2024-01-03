class ModifySettingsNameMaxLength < ActiveRecord::Migration[6.1]
  def up
    change_column :settings, :name, :string, limit: 100
  end

  def down
    change_column :settings, :name, :string, limit: 30
  end
end

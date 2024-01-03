class ChangeColumnNullable < ActiveRecord::Migration[6.1]
  def change
    change_column :activity_refs, :to_age, :integer, null: false
  end
end

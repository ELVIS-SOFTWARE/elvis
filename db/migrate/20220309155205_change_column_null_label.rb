class ChangeColumnNullLabel < ActiveRecord::Migration[6.1]
  def change
    change_column :activity_refs, :label, :string, null: false
  end
end

class ChangeColumnNull < ActiveRecord::Migration[6.1]
  def change
    change_column :activity_refs, :from_age, :integer, null: false
  end
end

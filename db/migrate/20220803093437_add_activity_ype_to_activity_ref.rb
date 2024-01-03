class AddActivityYpeToActivityRef < ActiveRecord::Migration[6.1]
  def change
    add_column :activity_refs, :activity_type, :integer
  end
end

class RemoveActivityRefIdFromActivityApplication < ActiveRecord::Migration[6.1]
  def change
    remove_column :activity_applications, :activity_ref_id, :integer
  end
end

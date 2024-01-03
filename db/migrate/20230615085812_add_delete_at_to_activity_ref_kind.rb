class AddDeleteAtToActivityRefKind < ActiveRecord::Migration[6.1]
  def change
    add_column :activity_ref_kinds, :deleted_at, :datetime
  end
end

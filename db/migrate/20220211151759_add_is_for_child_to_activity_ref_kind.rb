class AddIsForChildToActivityRefKind < ActiveRecord::Migration[6.1]
  def up
    add_column :activity_ref_kinds, :is_for_child, :boolean, default: "f"
  end

  def down
    remove_column :activity_ref_kinds, :is_for_child
  end
end

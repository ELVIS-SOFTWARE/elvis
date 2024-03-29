class AddDefaultActivityToActivityRefKinds < ActiveRecord::Migration[6.1]
  def change
    add_reference :activity_ref_kinds, :default_activity_ref, foreign_key: { to_table: :activity_refs, on_delete: :nullify }, null: true
  end
end

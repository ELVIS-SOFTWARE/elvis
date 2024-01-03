class RemoveKindFromActivityRef < ActiveRecord::Migration[6.1]
  def change
    remove_column :activity_refs, :kind, :string
  end
end

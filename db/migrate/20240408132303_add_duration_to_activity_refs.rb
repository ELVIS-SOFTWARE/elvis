class AddDurationToActivityRefs < ActiveRecord::Migration[6.1]
  def change
    add_column :activity_refs, :duration, :integer
  end
end

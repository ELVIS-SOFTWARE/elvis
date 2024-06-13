class FixMissingDurationInActivityRef < ActiveRecord::Migration[6.1]
  def up
    unless column_exists? :activity_refs, :duration
      add_column :activity_refs, :duration, :integer, null: true
    end
  end

  def down
    # do nothing because this migration is a missing column fix
  end
end

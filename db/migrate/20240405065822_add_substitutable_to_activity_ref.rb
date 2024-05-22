class AddSubstitutableToActivityRef < ActiveRecord::Migration[6.1]
  def up
    add_column :activity_refs, :substitutable, :boolean, default: true
    set_substitutable_initial_value
  end

  def down
    remove_column :activity_refs, :substitutable
  end

  private

  def set_substitutable_initial_value
    ActivityRef.connection.execute <<-SQL
      UPDATE activity_refs
      SET substitutable = CASE
        WHEN allows_timeslot_selection THEN false
        WHEN activity_type = #{ActivityRef.activity_types[:child]} THEN false
        WHEN activity_type = #{ActivityRef.activity_types[:cham]} THEN false
        ELSE true
      END
    SQL
  end
end

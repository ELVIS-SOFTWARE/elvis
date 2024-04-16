class DropDesiredLocationsAndTeachers < ActiveRecord::Migration[6.1]
  def up
    drop_table :desired_locations
    drop_table :desired_teachers
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end

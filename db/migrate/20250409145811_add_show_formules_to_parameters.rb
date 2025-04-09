class AddShowFormulesToParameters < ActiveRecord::Migration[6.0]
  def up
    execute <<-SQL
      INSERT INTO parameters (label, value, value_type, created_at, updated_at)
      VALUES ('show_formules', 'false', 'boolean', NOW(), NOW())
    SQL
  end

  def down
    execute <<-SQL
      DELETE FROM parameters WHERE label = 'show_formules'
    SQL
  end
end
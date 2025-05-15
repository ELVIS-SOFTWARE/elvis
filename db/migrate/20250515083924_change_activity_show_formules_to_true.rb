class ChangeActivityShowFormulesToTrue < ActiveRecord::Migration[6.1]
  def up
    execute <<-SQL
      UPDATE parameters
      SET value = 'true'
      WHERE label = 'activity.show_formules'
    SQL
  end

  def down
    execute <<-SQL
      UPDATE parameters
      SET value = 'false'
      WHERE label = 'activity.show_formules'
    SQL
  end
end

class InsertActivityApplicationAutomaticStatusParameter < ActiveRecord::Migration[6.1]
  def up
    execute <<~SQL
      INSERT INTO parameters (label, value, value_type, created_at, updated_at)
      VALUES (
        'activityApplication.automatic_status',
        'false',
        'boolean',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
    SQL
  end

  def down
    execute <<~SQL
      DELETE FROM parameters
      WHERE label = 'activityApplication.automatic_status';
    SQL
  end
end

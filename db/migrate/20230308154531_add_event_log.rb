class AddEventLog < ActiveRecord::Migration[6.1]
  def up
    create_table :event_logs do |t|
      t.string :event, null: false
      t.string :trigger_type, null: false
      t.string :sender_type, null: true
      t.datetime :created_at, null: false
      t.jsonb :args, null: true
      t.jsonb :args_types, null: true
    end
  end

  def down
    drop_table :event_logs
  end
end

class CreateEventSubscriptions < ActiveRecord::Migration[6.1]
  def up
    create_table :event_subscriptions do |t|
      t.string :event_group # user
      t.string :event # created
      t.boolean :async, default: false
      t.string :event_class # UserCreatedEvent (respond to execute)
      t.json :serialized_params, default: []
      t.json :serialized_params_types, default: []
      t.string :subscribe_id

      t.timestamps
    end
  end

  def down
    drop_table :event_subscriptions, if_exists: true
  end
end

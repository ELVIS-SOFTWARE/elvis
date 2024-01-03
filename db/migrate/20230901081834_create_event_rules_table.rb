class CreateEventRulesTable < ActiveRecord::Migration[6.1]
  def change
    create_table :event_rules do |t|
      t.string :name
      t.boolean :sendSMS
      t.boolean :sendMail
      t.string :event
      t.string :eventName
      t.string :subject

      t.timestamps
    end
  end
end

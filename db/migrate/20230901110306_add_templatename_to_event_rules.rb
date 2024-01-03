class AddTemplatenameToEventRules < ActiveRecord::Migration[6.1]
  def change
    add_column :event_rules, :templateName, :string
  end
end

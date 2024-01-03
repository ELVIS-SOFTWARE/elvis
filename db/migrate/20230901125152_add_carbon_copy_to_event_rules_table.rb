class AddCarbonCopyToEventRulesTable < ActiveRecord::Migration[6.1]
  def change
    add_column :event_rules, :carbon_copy, :string
  end
end

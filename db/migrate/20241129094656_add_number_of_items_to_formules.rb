class AddNumberOfItemsToFormules < ActiveRecord::Migration[6.1]
  def change
    add_column :formules, :number_of_items, :integer
  end
end

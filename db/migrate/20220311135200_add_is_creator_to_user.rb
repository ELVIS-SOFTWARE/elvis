class AddIsCreatorToUser < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :is_creator, :boolean, default: false
  end
end

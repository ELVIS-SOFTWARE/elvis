class AddAttachedToToUsers < ActiveRecord::Migration[6.1]
  def change
    add_reference :users, :attached_to, foreign_key: { to_table: :users }, null: true
  end
end

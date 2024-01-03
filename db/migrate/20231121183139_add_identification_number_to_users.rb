class AddIdentificationNumberToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :identification_number, :string
    add_index :users, :identification_number, unique: true
  end
end

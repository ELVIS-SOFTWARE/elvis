class CreateErrorCodes < ActiveRecord::Migration[6.1]
  def change
    create_table :error_codes do |t|
      t.string :name
      t.string :code, index: { unique: true }
      t.string :user_message

      t.timestamps
    end
  end
end

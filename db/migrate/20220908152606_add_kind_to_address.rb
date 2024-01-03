class AddKindToAddress < ActiveRecord::Migration[6.1]
  def up
    add_column :addresses, :kind, :string
  end

  def down
    remove_column :addresses, :kind
  end
end

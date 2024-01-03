class AddInvoicesColumnsToSchools < ActiveRecord::Migration[6.1]
  def up
    add_column :schools, :contact_user, :integer
    add_column :schools, :siret_rna, :string

    add_foreign_key :schools, :users, column: :contact_user
  end

  def down
    remove_foreign_key :schools, :users, column: :contact_user


    remove_column :schools, :contact_user
    remove_column :schools, :siret_rna
  end
end

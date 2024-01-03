class ChangedColumnsOfSchool < ActiveRecord::Migration[6.1]
  def up
    remove_foreign_key :schools, :users, column: :contact_user
    remove_column :schools, :contact_user, :integer

    add_column :schools, :legal_entity, :string
    add_column :schools, :billing_contact_id, :string
  end

  def down
    add_column :schools, :contact_user, :integer
    add_foreign_key :schools, :users, column: :contact_user

    remove_column :schools, :legal_entity
    remove_column :schools, :billing_contact_id
  end
end

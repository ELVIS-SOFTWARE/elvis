class AddEmailToSchool < ActiveRecord::Migration[6.1]
  def change
    add_column :schools, :email, :string
  end
end

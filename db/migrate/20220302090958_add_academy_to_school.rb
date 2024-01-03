class AddAcademyToSchool < ActiveRecord::Migration[6.1]
  def change
    add_column :schools, :academy, :string
  end
end

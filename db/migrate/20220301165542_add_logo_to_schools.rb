class AddLogoToSchools < ActiveRecord::Migration[6.1]
  def change
    add_column :schools, :logo, :string
  end
end

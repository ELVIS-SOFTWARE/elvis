class AddFormuleToActivityApplication < ActiveRecord::Migration[6.1]
  def change
    add_column :activity_applications, :formule_id, :integer
    add_foreign_key :activity_applications, :formules
  end
end

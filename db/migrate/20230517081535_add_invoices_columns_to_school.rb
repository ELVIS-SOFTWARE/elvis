class AddInvoicesColumnsToSchool < ActiveRecord::Migration[6.1]
  def up
    add_column :schools, :entity_subject_to_vat, :boolean, default: false
    add_column :schools, :activities_not_subject_to_vat, :boolean, default: false
  end

  def down
    remove_column :schools, :entity_subject_to_vat
    remove_column :schools, :activities_not_subject_to_vat
  end
end

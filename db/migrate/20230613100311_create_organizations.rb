class CreateOrganizations < ActiveRecord::Migration[6.1]
  def change
    create_table :organizations do |t|
      t.string :name
      t.string :reg_number
      t.jsonb :tax_id, null: true

      t.timestamps
    end
  end
end

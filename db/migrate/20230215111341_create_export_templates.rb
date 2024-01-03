class CreateExportTemplates < ActiveRecord::Migration[6.1]
  def self.up
    create_table :export_templates do |t|
      t.column "name", :string, limit: 30, null: false
      t.column "model", :string, null: false
      t.column "content", :string, null: false
      t.column "user_id", :bigint, null: true
      t.timestamps
    end

    add_foreign_key :export_templates, :users

  end

  def self.down
    remove_foreign_key :export_templates, :users
    drop_table :export_templates
  end
end


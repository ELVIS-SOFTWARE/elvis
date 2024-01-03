class CreateCreateNotificationTemplates < ActiveRecord::Migration[6.1]
  def change
    create_table :notification_templates do |t|
      t.text :body
      t.string :path
      t.string :locale
      t.string :handler
      t.boolean :partial, default: false
      t.string :format

      t.timestamps
    end
  end
end

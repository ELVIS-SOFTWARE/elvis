class AddNameToNotificationTemplates < ActiveRecord::Migration[6.1]
  def change
    add_column :notification_templates, :name, :string
  end
end

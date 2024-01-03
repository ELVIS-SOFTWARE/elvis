class AddJsonToNotificationTemplates < ActiveRecord::Migration[6.1]
  def change
    add_column :notification_templates, :json, :string
  end
end

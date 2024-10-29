class UpdateNotificationTemplatesName < ActiveRecord::Migration[6.1]
  def up
    NotificationTemplate.where(path: 'application_mailer/notify_new_application')
                        .update_all(name: 'Prise en compte de la demande d\'insription')
    NotificationTemplate.where(path: 'activity_assigned_mailer/activity_assigned')
                        .update_all(name: 'Cours attribué')
    NotificationTemplate.where(path: 'layouts/layout_mailer')
                        .update_all(name: 'Mise en page de l\'email')
  end

  def down
    NotificationTemplate.where(path: 'application_mailer/notify_new_application')
                        .update_all(name: 'Confirmation de la demande d\'inscription')
    NotificationTemplate.where(path: 'activity_assigned_mailer/activity_assigned')
                        .update_all(name: 'Activité assignée')
    NotificationTemplate.where(path: 'layouts/layout_mailer')
                        .update_all(name: 'Layout')
  end
end

class ChangeFirstActivityStatusLabel < ActiveRecord::Migration[6.1]
  def up
    activity_application_status = ActivityApplicationStatus.find_by(id: 1)
    activity_application_status.update_attribute(:label, "Soumis") if activity_application_status.present?
  end

  def down
    activity_application_status = ActivityApplicationStatus.find_by(id: 1)
    activity_application_status.update_attribute(:label, "En cours de traitement") if activity_application_status.present?
  end
end

class ChangeMailSentFromBooleanToDate < ActiveRecord::Migration[6.1]
  def up
    add_column :activity_applications, :mail_sent_at, :datetime, default: nil

    ActivityApplication.where(mail_sent: true).update_all(mail_sent_at: Time.zone.at(0))

    remove_column :activity_applications, :mail_sent
  end

  def down
    add_column :activity_applications, :mail_sent, :boolean, default: false

    ActivityApplication.where.not(mail_sent_at: nil).update_all(mail_sent: true)

    remove_column :activity_applications, :mail_sent_at
  end
end

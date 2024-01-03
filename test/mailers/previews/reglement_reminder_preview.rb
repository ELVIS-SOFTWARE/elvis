# frozen_string_literal: true

class ReglementReminderPreview < ActionMailer::Preview
  def send_reglement_reminder
    user = User.first
    # tout les payment sauf ceux qui ont un cashing date a nil ou superieur a la date du jour
    reglements = Payment.all - Payment.where(cashing_date: nil) - Payment.where("cashing_date > ?", DateTime.now)
    ReglementReminderMailer.send_reglement_reminder(user, reglements)
  end
end

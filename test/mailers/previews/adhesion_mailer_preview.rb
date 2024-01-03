# frozen_string_literal: true

class AdhesionMailerPreview < ActionMailer::Preview
  def reminder_email
    AdhesionMailer.with(user: User.last).reminder_email
  end
end

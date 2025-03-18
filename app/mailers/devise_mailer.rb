class DeviseMailer < Devise::Mailer
  layout "mailer"

  def reset_password_instructions(record, token, opts = {})
    mail = super

    mail.from ||= Parameter.get_value("app.application_mailer.default_from")
    name = School.first.name
    name.nil? ? subject = "Réinitialisation de votre mot de passe" :  subject = "#{name} - Réinitialisation de votre mot de passe"
    # logic
    mail.subject = subject
    mail
  end

  def confirmation_instructions(record, token, opts = {})
    mail = super

    mail.from ||= Parameter.get_value("app.application_mailer.default_from")
    name = School.first.name
    name.nil? ? subject = "Confirmation de la création de votre compte" :  subject = "#{name} - Confirmation de la création de votre compte"
    # logic
    mail.subject = subject
    mail
  end
end

class DebugMailer < ApplicationMailer
  default from: Parameter.get_value("app.application_mailer.default_from")
  layout "mailer"

  def debug_mailer
    @user = params[:user]
    logger.info "this is a debugging email"
    mail(from: "xavier@orzone.net", to: @user.email, subject: "Hello from debug")
  end
end

class DebugController < ApplicationController
  def index; end

  def send_mail
    DebugMailer.with(user: current_user).debug_mailer.deliver_later
  end
end

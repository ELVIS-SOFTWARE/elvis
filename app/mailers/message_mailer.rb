class MessageMailer < ApplicationMailer
  default from: Parameter.get_value("app.application_mailer.default_from")

  def send_message
    @from = params[:from]
    @to = params[:to]
    message = params[:message]

    @message = Message.create!(
      sender: @from,
      title: message["title"],
      content: message["content"],
      is_sms: message["isSMS"],
      is_email: message["isEmail"]
    )

    @message.recipients << User.where(id: @to).compact.uniq

    # Send email
    if @message.is_email
      name = School.first&.name || Parameter.get_value("app.name")

      if @from.nil? || @from.email.nil? || @to.nil? || @to.empty?
        emails = Parameter.get_value("app.message_mailer.email_addresses")

        mail(to: emails, subject: "#{name} - #{@message.title}") do |format|
          format.text { render plain: @message.content }
        end

      else
        emails = @message.recipients.map { |r| r.email }

        mail(from: @from.email, to: emails, subject: "#{name} - #{@message.title}") do |format|
          format.text { render plain: @message.content }
        end
      end
    end
  end
end

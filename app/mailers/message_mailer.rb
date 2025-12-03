class MessageMailer < LayoutMailer
  prepend_view_path NotificationTemplate.resolver

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
        mail(to: emails, subject: "#{name} - #{@message.title}")
      else
        emails = @message.recipients.map { |r| r.email }
        mail(to: emails, subject: "#{name} - #{@message.title}")
      end
    end
  end

  def liquid_assigns
    {
      "school_logo" => getSchoolLogo,
      "message_title" => @message.title,
      "message_content" => @message.content,
      "school_link" => get_button_school_link
    }
  end
end

class AdhesionMailer < LayoutMailer
  prepend_view_path NotificationTemplate.resolver
  default from: Parameter.get_value("app.application_mailer.default_from")

  def reminder_email
    @user = params[:user]

    emails = @user.get_users_paying_for_self.collect(&:email)
    emails << @user.email if emails.length == 0
    emails = emails.uniq.join(",")

    name = School.first.name

    logger.info "About to send an email to #{emails} from "
    mail(to: emails, subject: "#{name} - Votre adhésion va bientôt expirer")
  end

  def liquid_assigns
    {
      "school_logo" => getSchoolLogo,
      'first_name' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
      'school_link' => get_button_school_link("Connectez vous"),
    }
  end
end

class PasswordResetMailer < ApplicationMailer
  def reset_password_instructions(user, token)
    @user = user
    @reset_password_url = if Rails.env.kubernetes?
                            "#{ApplicationMailer.application_url}/u/edit_password.#{user.id}?reset_password_token=#{token}"
                          else
                            edit_password_url(user, reset_password_token: token)
                          end

    # Ajouter ce log pour déboguer
    Rails.logger.info "DEBUG: Sending reset password mail to #{@user.email} with URL: #{@reset_password_url}"

    template_variables = {
      "user_name" => "#{@user.first_name} #{@user.last_name}",
      "reset_password_url" => @reset_password_url
    }

    # Petit test pour vérifier que les variables ne sont pas nil
    Rails.logger.info "DEBUG: Template vars - user_name: '#{template_variables["user_name"]}', url length: #{template_variables["reset_password_url"].length}"

    mail(
      to: @user.email,
      subject: "Réinitialisation du mot de passe",
      template_path: 'password_reset_mailer',
      template_name: 'reset_password_instructions',
      template_variables: template_variables
    )
  end
end

class UserCreationValidator < ActiveModel::Validator

end

class RegistrationsController < Devise::RegistrationsController
  layout "application", only: [:edit, :update]

  def new
    super
  end

  def create
    recaptcha_token = params[:recaptcha_token]
    valid = verify_recaptcha(response: recaptcha_token,  action: "sign_up")
    score = if recaptcha_reply.present? # nil == recaptcha not configured
              (recaptcha_reply["score"] || 0)
            else
              1
            end

    has_mdp = (params)&.[](:has_mdp)

    self.resource = User.new(sign_up_params)

    min_score = Parameter.get_value("recaptcha.score_min") || 0.7

    if score < min_score
      resource.errors[:uniqueness] << "Quelque chose dans le comportement de votre navigateur nous a intrigué. Pourriez-vous réessayer ?"

      begin
        if !Rails.env.development? && Sentry.initialized?
          Sentry.capture_message("Recaptcha score too low for user #{self.resource.email} (#{score}/#{min_score})")
        end
        Rails.logger.error("Recaptcha score too low for user #{self.resource.email} (#{score}/#{min_score})")
      rescue StandardError => e
        Rails.logger.error "Error while sending Sentry message: #{e.message}"
      end

      respond_with resource and return
    end

    resource.first_connection = has_mdp
    resource.has_verified_infos = !has_mdp
    if !validate_user_fields(resource, request)
      if has_mdp
        render status: 406, json: { errors: resource.errors }
      else
        # redirect_to new_registration_path(resource) and return
        # build_resource(sign_up_params)
        respond_with resource and return
      end
    else
      if !has_mdp
        super
      else
        # build_ressource
        phones = Array.new()
        unless params[:user][:telephones].nil?
          params[:user][:telephones].each do |p|
            phone = Telephone.new({ number: p[:number], label: p[:label] })
            phones << phone
          end
        end
        resource.telephones = phones

        resource.update_addresses params[:user][:addresses] unless params[:user][:addresses].nil?

        resource.is_paying = params[:user][:is_paying]
        resource.checked_gdpr = params[:user][:checked_gdpr]
        resource.checked_image_right = params[:user][:checked_image_right]
        resource.checked_newsletter = params[:user][:checked_newsletter]
        resource.handicap = params[:user][:handicap]
        resource.handicap_description = params[:user][:handicap_description]

        resource.save

        # send Mail for password confirmation, and authentifies
        Devise::Mailer.confirmation_instructions(resource, resource.confirmation_token).deliver_now
        sign_in(resource)

        user = User.includes(
          :planning,
          :telephones,
          :addresses => {},
        )
        user = user.find(resource[:id])
        user = user.as_json(
          include: [:planning,
                    :telephones,
                    :addresses,]
        )
        render status: :created, json: { user: user }
      end
    end
    # TODO send mail to user giving him credentials (adherent number)
  end

  def check_uniqueness
    user_exists = User.exists?(first_name: params[:first_name], last_name: params[:last_name], birthday: params[:birthday])
    email_exists = User.exists?(email: params[:email])

    if user_exists
      render json: { exists: true, field: 'user', message: "Un compte existe déjà avec cette combinaison Nom - Prénom - Date de Naissance." }
    elsif email_exists
      render json: { exists: true, field:'email', message: "Un compte existe déjà avec cet email." }
    else
      render json: { exists: false }
    end

  end

  def update_resource(resource, params)
    resource.update_without_password(params) if params[:password].blank?

    if resource.valid_password?(self.params[:user][:current_password])
      resource.attempt_set_password(params)
      resource.update_without_password(params)
    else
      resource.errors.add("Mot de passe actuel", "incorrect")
    end
  end

  private

  def validate_user_fields(record, request)
    validated = true

    if record.last_name.blank? || record.first_name.blank? ||
      record.email.blank? || ((record.password.blank? || record.password.length < 8) && (!request.fullpath === "/u"))
      record.errors[:base] << "Tous les champs doivent être renseignés."
      validated = false
    end
    # validation over uniqueness of the record (first_name - last_name - birtday)
    record.unique_entry
    validated = validated && record.errors.details.empty?
    validated
  end

  def sign_up_params
    params.require(:user).permit(:first_name, :last_name, :email, :password, :password_confirmation, :birthday, :sex)
  end

  def account_update_params
    params.require(:user).permit(:first_name, :last_name, :email, :password, :password_confirmation)
  end
end

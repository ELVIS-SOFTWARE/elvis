class SessionsController < Devise::SessionsController
  
  def create
    matching_user = User
                      .where(email: params[:user][:login])
                      .or(User.where(adherent_number: params[:user][:login]))

    # verify if there are any admin users
    unless matching_user.where(is_admin: true).any?
      matching_user = matching_user.where(attached_to: nil)
    end

    if matching_user.many?
      matching_user.each do |user|
        redirect_to action: "pick_user", id: user.id and return if validate_user_login(user, params[:user])
      end
    elsif !matching_user.first.nil? && validate_user_login(matching_user.first, params[:user])
      sign_in :user, matching_user.first
      redirect_to after_sign_in_path_for(matching_user.first) and return
    end

    super
  end

  def create_with_token
    resource = User.find_by_authentication_token(params[:auth_token])
    if resource && resource.attached_to.nil?
      sign_in :user, resource
      redirect_to after_sign_in_path_for(resource) and return
    else
      redirect_back fallback_location: root_path and return
    end
  end

  def pick_user
    @user = User.find(params[:id])
    @users = User.where(email: @user.email, attached_to_id: nil)
  end

  def user_picked
    pwd = params[:user][:password]
    user = User.find_by(id: params[:user][:id], attached_to_id: nil)
    if user&.valid_password?(pwd)
      sign_in :user, user
      redirect_to controller: "users", action: "current_user_root"
    else
      redirect_to action: "pick_user", id: user.id
    end
  end

  # def switch
  #   @target_user = User.find(params[:id])
  #   if current_user.email == @target_user.email
  #     sign_in :user, @target_user
  #     redirect_to root_path
  #   end
  # end

  def switch_to
    user = User.find_by(id: params[:id], attached_to_id: nil)
    pwd = params[:password]

    if current_user.email == user.email && user.valid_password?(pwd)
      sign_in :user, user
      redirect_to controller: "users", action: "current_user_root"
    else
      redirect_to action: "pick_user", id: user.id
    end

  end

  def after_sign_in_path_for(resource)
    stored_location_for(resource) ||
      (resource.sign_in_count == 1 && welcome_path) ||
      root_path
  end

  private

  def validate_user_login(user, params)
    validated = true

    if params[:login].blank? || params[:password].blank? || !user.valid_password?(params[:password])
      user.errors.add(:base, "Login ou mot de passe incorrect.")
      validated = false
    end

    validated
  end
end

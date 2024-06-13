class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  before_action :save_request
  before_action :url_registration
  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :store_user_location!, if: :storable_location?
  before_action :authenticate_user!
  prepend_before_action :require_logo
  append_before_action :verify_season, only: [:index]

  attr_accessor :call_render

  before_action do
    if current_user&.creator?
      Rack::MiniProfiler.authorize_request if const_defined?("Rack::MiniProfiler")
    end
  end

  # catch all error in actions
  rescue_from BaseRendererError do |exception|

    Rails.logger.error "(#{exception.code}) #{exception.sup_message || exception.message}\n#{exception.backtrace.join("\n")}"

    error_code = Rack::Utils::HTTP_STATUS_CODES.key?(exception.code) ? exception.code : :internal_server_error

    respond_to do |format|
      format.json { render json: { message: exception.message, code: exception.code }, status: error_code }
      format.html { render "errors/base_renderer_error", status: error_code, locals: { message: exception.message, code: exception.code } }
    end
  end

  def require_logo
    @school_informations = School.includes(:address).first
  end

  # def set_redirect_path_for_user
  #   if current_user.is_admin || current_user.is_teacher
  #     redirect_path = main.app.root_url
  #   else # user
  #     # redirect to MyActivities
  #     redirect_path = my_activities_path(current_user.id)
  #   end
  #
  #   redirect_path
  # end

  rescue_from CanCan::AccessDenied do |exception|
    respond_to do |format|
      format.json { head :forbidden, content_type: "text/html" }
      format.csv { head :forbidden, content_type: "text/html" }
      format.html { redirect_to main_app.root_url, notice: exception.message }
      format.js { head :forbidden, content_type: "text/html" }
    end
  end

  def render(*args)
    self.call_render = true if self.call_render.nil?

    super(*args) if self.call_render
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit :sign_in, keys: %i[email password]
    devise_parameter_sanitizer.permit :sign_in, keys: %i[login password remember_me]
    devise_parameter_sanitizer.permit :account_update, keys: %i[password password_confirmation current_password]
  end

  private

  def verify_season
    if !current_user.nil? && current_user.is_admin && Season.none?
      @base_season_created = true

      [-1, 0, 1].each do |nb|
        base_season = Season.new

        current_date = DateTime.now + nb.year
        current_school_year = current_date.month < 9 ? current_date.year - 1 : current_date.year

        base_season.label = "Saison #{current_school_year}-#{current_school_year + 1}"
        base_season.start = DateTime.new current_school_year, 9, 1
        base_season.end   = DateTime.new current_school_year + 1, 6, 30
        base_season.is_current = nb == 0
        # base_season.is_next = nb == 1
        base_season.is_off = nb == -1
        base_season.opening_date_for_applications = base_season.start - 2.month
        base_season.opening_date_for_new_applications = base_season.start - 1.month
        base_season.closing_date_for_applications = base_season.start + 1.month

        base_season.save!
      end
    end
  end

  def set_current_user
    @current_user = current_user
  end

  # Its important that the location is NOT stored if:
  # - The request method is not GET (non idempotent)
  # - The request is handled by a Devise controller such as Devise::SessionsController as that could cause an
  #    infinite redirect loop.
  # - The request is an Ajax request as this can lead to very unexpected behaviour.
  def storable_location?
    request.get? && is_navigational_format? && !devise_controller? && !request.xhr?
  end

  def store_user_location!
    # :user is the scope we are authenticating
    store_location_for(:user, request.fullpath)
  end

  def save_request
    RequestStore.write(:request, request)
  end

  def url_registration
    url_string = request.base_url
    url_model = ApplicationUrl.find_or_create_by!(url: url_string)

    url_model.last_used_at = DateTime.now

    unless ApplicationUrl.where(is_main: true).any?
      url_model.is_main = true
    end

    url_model.save

  rescue StandardError => e
    Rails.logger.error e.message
  end
end

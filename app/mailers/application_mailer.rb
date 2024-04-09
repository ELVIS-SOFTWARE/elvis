require_relative 'liquid_drops/application_drop'
require_relative 'liquid_drops/activity_drop'

class ApplicationMailer < LayoutMailer
  default from: Parameter.get_value("app.application_mailer.default_from")
  prepend_view_path NotificationTemplate.resolver

  def self.application_url
    ApplicationUrl.main_root_url || (Rails.env.kubernetes? ? "https://#{ENV["DOMAIN"]}" : "http://localhost:5000")
  end

  def notify_new_application(activity_application_id)
    application = ActivityApplication.find(activity_application_id)

    @application = LiquidDrops::ApplicationDrop.new(application.as_json(include: {desired_activities: { activity_ref: {} }, user: {}, season: {}}))

    @activity_refs = application
                       .desired_activities
                       .map(&:activity_ref)
                       .compact

    @activity = LiquidDrops::DynamicDrop.new(@activity_refs.first)

    @school_informations = School.first

    @user = application.user

    name = School.first.name
    name.nil? ? subject = "Confirmation de demande d'inscription" :  subject = "#{name} - Confirmation de demande d'inscription"
    mail(to: @user.email, subject: subject)
  end

  def liquid_assigns
    {
      "school_logo" => getSchoolLogo,
      'first_name' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
      'school_link' => get_button_school_link,
      'activity' => @activity,
      'application' => @application
    }
  end
end

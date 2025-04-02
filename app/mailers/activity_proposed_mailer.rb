require_relative 'liquid_drops/application_drop'
require_relative 'liquid_drops/activity_drop'
class ActivityProposedMailer < LayoutMailer
  def activity_proposed(user, token, application, activity)
    name = School.first.name
    @user = user
    @confirmation_token = token
    @application = LiquidDrops::ApplicationDrop.new(application.as_json(include: {user: {}, season: {}}))
    @activity = LiquidDrops::ActivityDrop.new(activity.as_json(include: {activity_ref: {}, teacher: {}, room: {}, time_interval: {}}))

    mail(to: @user.email, subject: "#{name} - Proposition de cours en attente")
  end

  def liquid_assigns
    {
      "school_logo" => getSchoolLogo,
      'first_nam<>e' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
      'school_link' => get_button_school_link,
      'activity' => @activity,
      'application' => @application
    }
  end

end

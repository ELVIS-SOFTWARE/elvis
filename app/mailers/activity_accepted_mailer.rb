require_relative 'liquid_drops/application_drop'
require_relative 'liquid_drops/activity_drop'

class ActivityAcceptedMailer < LayoutMailer
  prepend_view_path NotificationTemplate.resolver

  def activity_accepted(record, token, activity)
    name = School.first.name
    @user = record
    @confirmation_token = token
    @activity = LiquidDrops::ActivityDrop.new(activity.as_json(include: {activity_ref: {}, teacher: {}, room: {}, time_interval: {}}))

    mail(to: record.email, subject: "#{name} - Proposition acceptée")
  end

  def liquid_assigns
    {
      "school_logo" => getSchoolLogo,
      'first_name' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
      'activity' => @activity,
      'school_link' => get_button_school_link,
    }
  end
end

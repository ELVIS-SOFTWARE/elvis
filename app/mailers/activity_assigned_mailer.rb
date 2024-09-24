require_relative 'liquid_drops/application_drop'
require_relative 'liquid_drops/activity_drop'

class ActivityAssignedMailer < LayoutMailer
  prepend_view_path NotificationTemplate.resolver

  def activity_assigned(user, token, application, activity)
    name = School.first.name
    @user = user
    @confirmation_token = token
    @application = LiquidDrops::ApplicationDrop.new(application.as_json(include: {
      user: {
        include: {
          payment_schedules: {
            include: {
              due_payments: {}
            }
          }
        }
      },
      season: {}
    }))

    @activity = LiquidDrops::ActivityDrop.new(activity.as_json(include: {
      activity_ref: { methods: :display_price },
      teacher: {},
      room: {},
      time_interval: {}
    }))

    mail(to: @user.email, subject: "#{name} - Confirmation d'attribution de cours")
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

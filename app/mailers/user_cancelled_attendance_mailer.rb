# frozen_string_literal: true
# require_relative 'liquid_drops/activity_drop'
require_relative 'liquid_drops/activity_instance_drop'

class UserCancelledAttendanceMailer < ApplicationMailer
  prepend_view_path NotificationTemplate.resolver

  def cancelled_attendance(user, activity_instance)
    name = Parameter.get_value("app.name")
    @user = user
    @activity_instance = LiquidDrops::ActivityInstanceDrop.new(activity_instance.as_json(include: {
      activity: {
        include: {
          activity_ref: {},
          teacher: {},
        }
      },
      time_interval: {}
    }))

    mail(to: user.email, subject: "#{name} - Confirmation d'annulation de cours")
  end

  def liquid_assigns
    {
      "school_logo" => getSchoolLogo,
      'first_name' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
      'activity_instance' => @activity_instance,
      'school_link' => get_button_school_link,
    }
  end
end

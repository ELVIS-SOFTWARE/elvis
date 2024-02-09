# frozen_string_literal: true
require_relative 'liquid_drops/activity_drop'

class UserCancelledAttendanceMailer < ApplicationMailer
  prepend_view_path NotificationTemplate.resolver

  def cancelled_attendance(user, activity)
    name = Parameter.get_value("app.name")
    @user = user
    @activity = LiquidDrops::ActivityDrop.new(activity.as_json(include: {activity_ref: {}, teacher: {}, room: {}, time_interval: {}}))

    mail(to: user.email, subject: "#{name} - Confirmation d'annulation de cours")
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

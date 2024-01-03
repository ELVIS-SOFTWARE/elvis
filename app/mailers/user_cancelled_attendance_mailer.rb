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
      "logo_url" => getSchoolLogo,
      'first_name' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
      'activity' => @activity,
    }
  end
end

# frozen_string_literal: true
require_relative 'liquid_drops/activity_drop'

class AdminCancelledAttendanceMailer < ApplicationMailer
  prepend_view_path NotificationTemplate.resolver

  def cancelled_attendance(activity, student)
    name = Parameter.get_value("app.name")
    @user = student
    @activity = LiquidDrops::ActivityDrop.new(activity.as_json(include: {activity_ref: {}, teacher: {}, room: {}, time_interval: {}}))

    User.where(is_admin: true).each do |admin|
      mail(to: admin.email, subject: "#{name} - Annulation de cours par un élève")
    end
  end

  def liquid_assigns
    {
      "logo_url" => getSchoolLogo,
      'activity' => @activity,
      'first_name' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
    }
  end
end

# frozen_string_literal: true
# require_relative 'liquid_drops/activity_drop'
require_relative 'liquid_drops/activity_instance_drop'

class AdminCancelledAttendanceMailer < ApplicationMailer
  prepend_view_path NotificationTemplate.resolver

  def cancelled_attendance(activity_instance, student)
    name = Parameter.get_value("app.name")
    @user = student
    @activity_instance = LiquidDrops::ActivityInstanceDrop.new(activity_instance.as_json(include: {
      activity: {
        include: {
          activity_ref: {},
          teacher: {},
          room: {},
          time_interval: {}
        }
      },
      time_interval: {}
    }))

    User.where(is_admin: true).each do |admin|
      mail(to: admin.email, subject: "#{name} - Annulation de cours par un élève")
    end
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

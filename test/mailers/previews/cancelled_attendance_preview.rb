# frozen_string_literal: true

class CancelledAttendancePreview < ActionMailer::Preview

  # http://localhost:5000/rails/mailers/cancelled_attendance/user_cancelled_attendance
  def user_cancelled_attendance
    user = User.last
    activity = Activity.last

    UserCancelledAttendanceMailer.cancelled_attendance(user, activity)
  end

  # http://localhost:5000/rails/mailers/cancelled_attendance/admin_cancelled_attendance
  def admin_cancelled_attendance
    activity = Activity.last

    AdminCancelledAttendanceMailer.cancelled_attendance(activity, User.last)
  end
end


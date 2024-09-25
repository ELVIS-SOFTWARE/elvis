# frozen_string_literal: true

require_relative 'base_listener'

# Evènements commentés pour le moment car ils ne sont pas encore utilisés
class NotificationListener < BaseListener

  def self.subscribe
    event_ids ||= []

    event_ids << EventHandler.notification.user_created.subscribe(true) do |sender:, args:|
      user = args[:model]
      DeviseMailer.confirmation_instructions(user, user.confirmation_token).deliver_later

      # event = EventRules.find_by_eventName("user_created")
      # if event.present?
      #   if event.sendMail?
      #     DeviseMailer.confirmation_instructions(user, user.confirmation_token).deliver_later
      #   end
      # end
    end

    event_ids << EventHandler.notification.activity_assigned.subscribe(true) do |sender:, args:|
      user = args[:user]
      application = args[:application]
      activity = args[:activity]
      ActivityAssignedMailer.activity_assigned(user, user.confirmation_token, application, activity).deliver_later

      # event = EventRules.find_by_eventName("activity_assigned")
      # if event.present?
      #   if event.sendMail?
      #     # mail
      #     ActivityAssignedMailer.activity_assigned(user, user.confirmation_token, application, activity).deliver_later
      #   end
      # end
    end

    event_ids << EventHandler.notification.activity_accepted.subscribe(true) do |sender:, args:|
      user = args[:user]
      activity = args[:activity]
      ActivityAcceptedMailer.activity_accepted(user, user.confirmation_token, activity).deliver_later


      # event = EventRules.find_by_eventName("activity_accepted")
      # if event.present?
      #   if event.sendMail?
      #     ActivityAcceptedMailer.activity_accepted(user, user.confirmation_token, activity).deliver_later
      #   end
      # end
    end

    event_ids << EventHandler.notification.application_created.subscribe(true) do |sender:, args:|
      activity_application_id = args[:activity_application_id]
      ApplicationMailer.notify_new_application(activity_application_id).deliver_later

      # event = EventRules.find_by_eventName("activity_accepted")
      # if event.present?
      #   if event.sendMail?
      #     ApplicationMailer.notify_new_application(activity_application_id).deliver_later
      #   end
      # end
    end

    event_ids << EventHandler.notification.activity_cancelled.subscribe(true) do |sender:, args:|
      activity_instance = args[:activity_instance]
      user = args[:user]

     UserCancelledAttendanceMailer.cancelled_attendance(user, activity_instance).deliver_later
      AdminCancelledAttendanceMailer.cancelled_attendance(activity_instance, user).deliver_later



      # event = EventRules.find_by_eventName("activity_cancelled")
      # if event.present?
      #   if event.sendMail?
      #     UserCancelledAttendanceMailer.cancelled_attendance(activity, User.last).deliver_later
      #     AdminCancelledAttendanceMailer.cancelled_attendance(activity, User.last).deliver_later
      #   end
      # end
    end

    event_ids << EventHandler.notification.upcoming_payment.subscribe(true) do |sender:, args:|
      user = args[:user]
      application = args[:application]
      UpcomingPaymentMailer.upcoming_payment(user, user.confirmation_token, application).deliver_later


    end
  end
end

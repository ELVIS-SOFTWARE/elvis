# frozen_string_literal: true

class NotifyUsersOfApplicationStateJob < ApplicationJob

  def perform(params)
    application_ids = params[:applications_ids]
    current_user_id = params[:current_user_id]

    email_user_sended = []

    begin

      mails_to_send = ActivityApplication.where(id: application_ids)

      ActivityApplication.transaction do
        mails_to_send.each do |application|

          user = application.user

          application.desired_activities.each do |desired_activity|
            activity = desired_activity.activity

            # mail
            case application.activity_application_status_id
            when ActivityApplicationStatus::ACTIVITY_ATTRIBUTED_ID
              ActivityAssignedMailer.activity_assigned(user, user.confirmation_token, application, activity).deliver_later
            when ActivityApplicationStatus::ACTIVITY_PROPOSED_ID
              ActivityProposedMailer.activity_proposed(user, user.confirmation_token, application, activity).deliver_later
            when ActivityApplicationStatus::PROPOSAL_ACCEPTED_ID
              ActivityAcceptedMailer.activity_accepted(user, user.confirmation_token, application).deliver_later
            else
              next # skip if not in the right status
            end
          end

          email_user_sended << user.id

          application.mail_sent = true
          application.save!
        end
      end

    rescue StandardError => e
      Rails.logger.error "Error in NotifyUsersOfApplicationStateJob: #{e.message}"

      if current_user_id.present?
        MessageMailer.with(message: {
          title: "Notification d'erreur lors de l'envoi des mails",
          content: "Une erreur est survenue lors de l'envoi des mails de notification des états des candidatures. Les utilisateurs suivant ont bien reçu leur mail : #{email_user_sended.join(', ')}.",
          isSMS: false,
          isEmail: true
        }, to: User.where(id: current_user_id, from: User.new(email: Parameter.get_value("app.application_mailer.default_from")))).send_message.deliver_later
      end
    end
  end
end

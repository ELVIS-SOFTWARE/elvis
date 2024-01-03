# frozen_string_literal: true

class PaymentReminderPreview < ActionMailer::Preview

  def send_reminder
    user = User.find 6
    due_payments = user.payment_schedules.map(&:due_payments).flatten.select { |dp| dp.due_payment_status_id == DuePaymentStatus::UNPAID_ID }

    PaymentReminderMailer.send_payment_reminder(user, due_payments)
  end
end

# frozen_string_literal: true
require_relative 'liquid_drops/application_drop'
require_relative 'liquid_drops/activity_drop'
require_relative 'liquid_drops/payment_drop'


class PaymentReminderMailer < LayoutMailer
  prepend_view_path NotificationTemplate.resolver

  def send_payment_reminder(user, due_payments)
    name = School.first.name
    @user = user
    @payments_unpaid = due_payments.as_json

    if due_payments.class == Array
      @payments = LiquidDrops::PaymentDrop.new(due_payments[0].payment_schedule.as_json)
    else
      @payments = LiquidDrops::PaymentDrop.new(due_payments.payment_schedule.as_json)
    end

    @payments_unpaid.each { |payment|
      status_obj = DuePaymentStatus.find(payment["due_payment_status_id"].to_i).as_json
      status = "<a type='button' style='color: white; padding: 10px; border-radius: 5px; background-color:" + status_obj["color"] + "'>" + status_obj["label"] + "</a>"
      payment["status"] = status
    }

    @payments_unpaid.each { |payment| payment["previsional_date"] =  payment["previsional_date"].to_date.strftime("%d/%m/%Y") + "" if payment["previsional_date"] != nil }

    mail(to: user.email, subject: "#{name} - Rappel de paiement")
  end

  def liquid_assigns
    {
      "school_logo" => getSchoolLogo,
      'first_name' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
      'school_link' => get_button_school_link,
      'payments' => @payments,
      'due_payments' => @payments_unpaid,
    }
  end
end

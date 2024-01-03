# frozen_string_literal: true
require_relative 'liquid_drops/application_drop'
require_relative 'liquid_drops/activity_drop'

class ReglementReminderMailer < ApplicationMailer
  prepend_view_path NotificationTemplate.resolver

  def send_reglement_reminder(user, reglements)
    name = School.first.name
    @user = user

    @reglements = reglements.as_json
    @reglements.each { |reglement| reglement["status"] =  "<a type='button' style='color: white; padding: 10px; border-radius: 5px; background-color:" + PaymentStatus.find(reglement["payment_status_id"]).as_json["color"] + "'>" + PaymentStatus.find(reglement["payment_status_id"]).as_json['label'] + "</a>"}
    @reglements.each { |reglement| reglement["cashing_date"] =  reglement["cashing_date"].to_date.strftime("%d/%m/%Y") + "" if reglement["cashing_date"] != nil}

    mail(to: user.email, subject: "#{name} - Rappel de paiement")
  end

  def liquid_assigns
    {
      "school_logo" => getSchoolLogo,
      'first_name' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
      'school_link' => get_button_school_link,
      'reglements' => @reglements,
    }
  end
end

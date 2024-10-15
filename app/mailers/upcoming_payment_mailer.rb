require_relative 'liquid_drops/application_drop'
require_relative 'liquid_drops/activity_drop'
class UpcomingPaymentMailer < ApplicationMailer
  prepend_view_path NotificationTemplate.resolver

  # @param [User] user
  # @param [Array] generatedDataForPaymentSummary
  def upcoming_payment(user, season, generatedDataForPaymentSummary)
    name = School.first.name
    @user = user
    @confirmation_token = user.confirmation_token
    @season_label = season.label

    @total_due = generatedDataForPaymentSummary
                  .reduce(0.0) { |acc, d| acc + Float(d[:due_total]) }
                  .round(2)

    mail(to: @user.email, subject: "#{name} - Paiement à venir")
  end

  def liquid_assigns
    {
      "school_logo" => getSchoolLogo,
      'first_name' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
      'school_link' => get_button_school_link,
      'total_due' => @total_due,
      'season_label' => @season_label,
      # for compatibility with the old template
      'application' => {
        'season_label' => @season_label,
        'total_all_due_payments' => @total_due,
      },
    }
  end

end

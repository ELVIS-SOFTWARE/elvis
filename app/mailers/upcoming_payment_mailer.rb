require_relative 'liquid_drops/application_drop'
require_relative 'liquid_drops/activity_drop'
class UpcomingPaymentMailer < ApplicationMailer
  prepend_view_path NotificationTemplate.resolver

  def upcoming_payment(record, token, application)
    name = School.first.name
    @user = record
    @confirmation_token = token
    @application = LiquidDrops::ApplicationDrop.new(application.as_json(include: {
      user: {
        include: {
          payment_schedules: {
            include: {
              due_payments: {}
            }
          }
        }
      },
      season: {}
    }))

    mail(to: @user.email, subject: "#{name} - Paiement à venir")
  end

  def liquid_assigns
    {
      "school_logo" => getSchoolLogo,
      'first_name' => @user.first_name.capitalize,
      'last_name' => @user.last_name.capitalize,
      'school_link' => get_button_school_link,
      'activity' => @activity,
      'application' => @application
    }
  end

end

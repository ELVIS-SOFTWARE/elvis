# frozen_string_literal: true
module LiquidDrops
  class ApplicationDrop < Liquid::Drop

    def initialize(application)
      @application = application
    end

    def id
      @application["id"]
    end

    def user_id
      @application["user_id"]
    end

    def email
      @application["user"]["email"]
    end

    def first_name
      @application["user"]["first_name"]
    end

    def last_name
      @application["user"]["last_name"]
    end

    def birthday
      @application["user"]["birthday"]
    end

    def adherent_number
      @application["user"]["adherent_number"]
    end

    def start
      @application["season"]["start"]
    end

    def end
      @application["season"]["end"]
    end

    def season_label
      @application["season"]["label"]
    end

    def total_due_payments
      user = @application["user"]
      payment_schedules = user["payment_schedules"] || []

      due_payments = payment_schedules.map { |schedule| schedule["due_payments"] }.flatten
      pending_due_payments = due_payments.select do |dp|
        dp["due_payment_status_id"] != DuePaymentStatus::PAID_ID
      end
      total_due = pending_due_payments.sum { |dp| dp["amount"].to_f }

      total_due
    end

  end
end


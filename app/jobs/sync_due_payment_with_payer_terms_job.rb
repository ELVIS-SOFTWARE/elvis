# frozen_string_literal: true

class SyncDuePaymentWithPayerTermsJob < ApplicationJob

  def perform(*_args)
    is_creation = _args.first&.fetch(:creation, false)
    payer_payment_term_id = _args.first&.fetch(:id, 0)

    payment_payer_terms = PayerPaymentTerms.find_by(id: payer_payment_term_id)

    if payment_payer_terms.nil?
      return
    end

    user = payment_payer_terms.payer
    schedule = user.payment_schedules.find_by(season_id: payment_payer_terms.season_id)

    return if schedule.nil?

    if is_creation
      data = PaymentHelper.generate_payer_payment_summary_data user, payment_payer_terms.season

      total_des = data.filter {|d| d[:type] == :des}.sum {|d| d[:amount]}
      total_adh = data.filter {|d| d[:type] == :adh}.sum {|d| d[:amount]}

      amount_per_due = total_des / payment_payer_terms.payment_terms.collect_on_months.length

      day_to_collect = payment_payer_terms.payment_terms.days_allowed_for_collection[payment_payer_terms.day_for_collection]

      base_due_data = {
        payment_method_id: payment_payer_terms.payment_method_id,
        created_by_payer_payment_term: true,
        amount: amount_per_due,
        operation: "+",
        due_payment_status_id: DuePaymentStatus::PENDING_ID
      }

      DuePayment.transaction do

        # create for activities
        if total_des.positive?
          payment_payer_terms.payment_terms.collect_on_months.each do |month|
            date = Date.new(payment_payer_terms.season.start.year, month+1, day_to_collect)

            if date.month < payment_payer_terms.season.start.month
              date = date.next_year
            end

            schedule.due_payments.create!(base_due_data.merge(previsional_date: date))
          end
        end

        if Adhesion.enabled && total_adh.positive?
          adh_date = Date.new(payment_payer_terms.season.start.year, payment_payer_terms.season.start.month, day_to_collect)

          # create for adhesions
          schedule.due_payments.create!(base_due_data.merge(previsional_date: adh_date, amount: total_adh))
        end
      end
    else
      due_payments = schedule.due_payments.where(created_by_payer_payment_term: true, previsional_date: Date.today..)

      DuePayment.transaction do
        due_payments.each do |due_payment|
          due_payment.payment_method_id = payment_payer_terms.payment_method_id

          prevision_date = due_payment.previsional_date

          # set day of month at day for collection
          due_payment.previsional_date = prevision_date.change(day: payment_payer_terms.payment_terms.days_allowed_for_collection[payment_payer_terms.day_for_collection])

          due_payment.save!
        end
      end
    end
  end
end

# frozen_string_literal: true

class SyncDuePaymentWithPayerTermsJob < ApplicationJob

  def perform(*_args)
    is_creation = _args.first&.fetch(:creation, false)
    payer_payment_term_id = _args.first&.fetch(:id, 0)

    payer_payment_terms = PayerPaymentTerms.find_by(id: payer_payment_term_id)

    return if payer_payment_terms.nil?

    user = payer_payment_terms.payer
    schedule = user.payment_schedules.find_by(season_id: payer_payment_terms.season_id)

    return if schedule.nil?

    if is_creation
      data = PaymentHelper.generate_payer_payment_summary_data user, payer_payment_terms.season

      total_des = data.filter {|d| d[:type] == :des}.sum {|d| d[:amount]}
      total_adh = data.filter {|d| d[:type] == :adh}.sum {|d| d[:amount]}

      amount_per_due = total_des / payer_payment_terms.payment_schedule_options.payments_months.length

      day_to_collect = payer_payment_terms.payment_schedule_options.available_payments_days[payer_payment_terms.day_for_collection]

      base_due_data = {
        payment_method_id: payer_payment_terms.payment_method_id,
        created_by_payer_payment_term: true,
        amount: amount_per_due,
        operation: "+",
        due_payment_status_id: DuePaymentStatus::PENDING_ID
      }

      DuePayment.transaction do

        # create for activities
        if total_des.positive?
          payer_payment_terms.payment_schedule_options.payments_months.each do |month|
            date = Date.new(payer_payment_terms.season.start.year, month+1, day_to_collect)

            if date.month < payer_payment_terms.season.start.month
              date = date.next_year
            end

            schedule.due_payments.create!(base_due_data.merge(previsional_date: date))
          end
        end

        if Adhesion.enabled && total_adh.positive?
          adh_date = Date.new(payer_payment_terms.season.start.year, payer_payment_terms.season.start.month, day_to_collect)

          # create for adhesions
          schedule.due_payments.create!(base_due_data.merge(previsional_date: adh_date, amount: total_adh))
        end
      end


    else
      due_payments = schedule.due_payments.where(created_by_payer_payment_term: true, previsional_date: Date.today..)

      DuePayment.transaction do
        due_payments.each do |due_payment|
          due_payment.payment_method_id = payer_payment_terms.payment_method_id

          prevision_date = due_payment.previsional_date

          # set day of month at day for collection
          due_payment.previsional_date = prevision_date.change(day: payer_payment_terms.payment_schedule_options.available_payments_days[payer_payment_terms.day_for_collection])

          due_payment.save!
        end
      end
    end
  end
end

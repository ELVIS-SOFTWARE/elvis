# == Schema Information
#
# Table name: due_payments
#
#  id                            :bigint           not null, primary key
#  payment_schedule_id           :bigint
#  number                        :integer
#  previsional_date              :date
#  amount                        :decimal(, )
#  created_at                    :datetime         not null
#  updated_at                    :datetime         not null
#  payment_method_id             :bigint
#  due_payment_status_id         :bigint
#  location_id                   :bigint
#  operation                     :string(1)        default("+")
#  created_by_payer_payment_term :boolean          default(FALSE)
#

class DuePayment < ApplicationRecord
  belongs_to :payment_schedule
  belongs_to :payment_method, required: false
  has_many :payments, dependent: :delete_all

  belongs_to :due_payment_status, optional: true

  belongs_to :location, optional: true

  accepts_nested_attributes_for :payment_method

  def self.display_class_name(singular = true)
    singular ? "échéance" : "échéances"
  end

  def self.class_name_gender
    return :F
  end


  def adjusted_amount
    case self.operation
    when "-"
      -self.amount
    when "0"
      0
    when "+"
      self.amount
    end
  end

  def create_related_payment(payment_status = PaymentStatus::PENDING)
    schedule = payment_schedule
    payment = Payment.create!({
                                amount: amount,
                                due_payment: self,
                                payment_method_id: payment_method_id,
                                payable_id: schedule.payable_id,
                                payable_type: schedule.payable_type,
                                cashing_date: previsional_date,
                                payment_status: payment_status
                              })

    reevaluate_status

    payment
  end


  def reevaluate_status

    # set due payment to paid if totals are equal or greater (acceptable_difference of 0.01)
    # if the sum of payments is greater, then it will be displayed as so on frontend
    if total_payed >= adjusted_amount
      update(due_payment_status: DuePaymentStatus::PAID)

    elsif DateTime.now < self.previsional_date
      # si on n'a pas atteint la date du terme
      # ne rien faire

    elsif payments.where(payment_status: PaymentStatus::FAILED).any?
      # si on a au moins un paiement échoué, on marque l'échéance comme échouée
      update due_payment_status: DuePaymentStatus::FAILED

    else
      # on est ici dans le cas où
      # * l'échéance n'est pas payée (complètement)
      # * la date d'échéance est dépassée
      # * aucun paiement n'a été marqué comme "échoué"

      update(due_payment_status: DuePaymentStatus::UNPAID)
    end
  end

  ###
  # Renvoie la somme des montants des règlements validés pour cette échéance
  def total_payed
    payments
      .where(payment_status_id: PaymentStatus::PAID_ID)
      .map(&:adjusted_amount)
      .sum || 0
  end

  def self.mark_unpaid(for_date = DateTime.now)
    dues = DuePayment.where(previsional_date: for_date)
    dues = DuePayment.identify_unpaid_dues(dues)
    dues.each{ |due| due.save! }
  end

  def as_json(options={})
    super options.merge(:methods => :adjusted_amount)
  end

    private
  def self.identify_unpaid_dues(due_payments)
    unpaid_due_status = DuePaymentStatus::UNPAID

    due_payments.each do |due_payment|
      total = due_payment.payments.reduce(0.0){ |acc, p| acc + p.amount }

      difference = due_payment.amount - total
      acceptable_difference = 0.01

      if difference > acceptable_difference
        # unpaid
        due_payment.due_payment_status = unpaid_due_status
      elsif difference < 0
        # Total paid exceed the due amount -> Too much paid
        # TODO Create new status 
      else
        # paid
        due_payment.due_payment_status = nil
      end
    end

    due_payments
  end
end

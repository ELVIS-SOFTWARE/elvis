# == Schema Information
#
# Table name: payment_schedule_options
#
#  id                          :bigint           not null, primary key
#  label                       :string
#  payments_number                :integer
#  payments_months           :jsonb
#  available_payments_days :jsonb
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  deleted_at                  :datetime
#  pricing_category_id                  :bigint
#  index                       :integer
#
class PaymentScheduleOptions < ApplicationRecord
  acts_as_paranoid

  has_many :payer_payment_terms, class_name: "PayerPaymentTerms", dependent: :destroy
  has_many :payers, through: :payer_payment_terms
  belongs_to :pricing_category

  def self.display_class_name(singular = true)
    singular ? "option d'échéancier de paiement" : "options d'échéancier de paiement"
  end

  def self.class_name_gender
    return :F
  end

  def self.jsonize_payment_schedule_options_query(query)
    res = query.as_json(
      except: [:created_at, :updated_at, :deleted_at],
    )

    res
  end

end

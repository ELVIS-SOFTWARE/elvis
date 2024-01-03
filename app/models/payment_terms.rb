# == Schema Information
#
# Table name: payment_terms
#
#  id                          :bigint           not null, primary key
#  label                       :string
#  terms_number                :integer
#  collect_on_months           :jsonb
#  days_allowed_for_collection :jsonb
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  deleted_at                  :datetime
#  pricing_id                  :bigint
#  index                       :integer
#
class PaymentTerms < ApplicationRecord
  acts_as_paranoid

  has_many :payer_payment_terms, class_name: "PayerPaymentTerms", dependent: :destroy
  has_many :payers, through: :payer_payment_terms

  def self.display_class_name(singular = true)
    singular ? "modalité de paiement" : "modalités de paiement"
  end

  def self.class_name_gender
    return :F
  end

  def self.jsonize_payment_terms_query(query)
    res = query.as_json(
      except: [:created_at, :updated_at, :deleted_at],
    )

    res
  end

end

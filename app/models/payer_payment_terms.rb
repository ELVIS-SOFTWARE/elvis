# == Schema Information
#
# Table name: payer_payment_terms
#
#  id                 :bigint           not null, primary key
#  day_for_collection :integer
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  deleted_at         :datetime
#  payer_id           :bigint           not null
#  payment_terms_id   :bigint           not null
#  season_id          :bigint           not null
#  payment_method_id  :bigint
#
class PayerPaymentTerms < ApplicationRecord
  acts_as_paranoid

  belongs_to :payer, class_name: "User"
  belongs_to :payment_terms
  belongs_to :season
  belongs_to :payment_method, optional: true

  validate :uniqueness

  def self.display_class_name(singular = true)
    singular ? "modalité de paiement pour un payeur" : "modalités de paiement pour les payeurs"
  end

  def self.class_name_gender
    return :F
  end

  private

  def uniqueness
    # return if is not a creation
    return unless new_record?
    return if PayerPaymentTerms.where(payer_id: payer_id, season_id: season_id).empty?

    errors.add(:base,
               "Des modalités de paiement existent déjà pour la saison #{season.label}, le payeur #{payer.full_name}, veuillez faire une mise à jour")
  end
end

# == Schema Information
#
# Table name: adhesions
#
#  id                  :bigint           not null, primary key
#  user_id             :bigint
#  validity_start_date :date
#  validity_end_date   :date
#  is_active           :boolean
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  deleted_at          :datetime
#  last_reminder       :datetime
#  season_id           :bigint
#  adhesion_price_id   :integer
#

class Adhesion < ApplicationRecord
  update_index("adhesions") { self }

  def run_chewy_callbacks
    base_chewy_callbacks
  end

  acts_as_paranoid

  belongs_to :user
  belongs_to :season, optional: true
  belongs_to :adhesion_price, optional: true

  has_one :payment_method
  has_one :discount, as: :discountable, dependent: :destroy

  scope :currently_active, -> { where("validity_start_date < NOW() AND validity_end_date > NOW() AND is_active = TRUE") }

  def self.display_class_name(singular= true)
    singular ? "adhésion" : "adhésions"
  end

  def self.class_name_gender
    return :F
  end

  def self.enabled
    Parameter.get_value("adhesion.enabled")
  end

  def self.fee
    if Parameter.get_value("adhesion.enabled")
      Parameter.get_value("ADHESION_FEE")
    else
      0
    end
  end

  def self.set_fee(value)
    adhesion_fee = Parameter.find_or_create_by(label: "ADHESION_FEE", value_type: "float")
    adhesion_fee.value = value
    adhesion_fee.save
  end

  # Instruction permettant de supprimer un objet utilisant la classe courante
  # @param [ApplicationRecord] source_object objet qui a appelé la méthode
  # @return [{ instruction: String, possible: Boolean }]
  def undeletable_instruction(source_object = nil)
    case source_object
    when Season
      { instruction: "supprimer l'adhésion de #{user.full_name}", possible: true }
    else
      super
    end
  end
end

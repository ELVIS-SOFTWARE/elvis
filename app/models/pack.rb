class Pack < ApplicationRecord

  belongs_to :user
  belongs_to :activity_ref_pricing
  belongs_to :season

  has_one :activity_ref, through: :activity_ref_pricing

  def self.display_class_name(singular= true)
    singular ? "Pack" : "Packs"
  end

  def self.class_name_gender
    return :M
  end
end

class FormuleItem < ApplicationRecord
  belongs_to :formule
  belongs_to :item, polymorphic: true

  validates :item_type, inclusion: { in: %w(ActivityRef ActivityRefKind) }

  def self.display_class_name(singular= true)
    singular ? "Item" : "Items"
  end

  def self.class_name_gender
    return :M
  end
end

class FormulePricing < ApplicationRecord
  belongs_to :formule
  belongs_to :pricing_category
  belongs_to :from_season, class_name: 'Season'
  belongs_to :to_season, class_name: 'Season', optional: true

  scope :for_season, ->(season) { for_season_id(season&.id) }
  scope :for_season_id, ->(season_id) { where("from_season_id <= ? AND (to_season_id IS NULL OR to_season_id >= ?)", season_id, season_id) }

  scope :for_pricing_category, ->(pricing_category) { where(pricing_category: pricing_category) }
  scope :for_pricing_category_id, ->(pricing_category_id) { where(pricing_category_id: pricing_category_id) }

  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :from_season_id, presence: true
  validates :pricing_category_id, presence: true

  def self.display_class_name(singular= true)
    singular ? "Tarif" : "Tarifs"
  end

  def self.class_name_gender
    return :M
  end

  def overlaps?(pricing)
    # saison à comparer
    self_from_season = Season.find(self.from_season_id)
    self_to_season = Season.find(self.to_season_id) unless self.to_season_id.nil?

    # saison à créer
    pricing_from_season = Season.find(pricing.from_season_id)
    pricing_to_season = Season.find(pricing.to_season_id) unless pricing.to_season_id.nil?

    # self_from_season_start [ ] self_to_season_end
    self_season_start = self_from_season.start # date de début de la saison à comparer
    self_season_end = self_to_season.end if self_to_season # date de fin de la saison à comparer

    # pricing_from_season_start ( ) pricing_to_season_end
    pricing_season_start = pricing_from_season.start # date de début de la saison à créer
    pricing_season_end = pricing_to_season.end if pricing_to_season # date de fin de la saison à créer

    # [ (
    return true if self_season_end.nil? && pricing_season_end.nil?

    # ( [ )
    if self_season_end.nil? && pricing_season_end
      return true if self_season_start < pricing_season_end
    end

    # [ ( ]
    if self_season_end && pricing_season_end.nil?
      return true if pricing_season_start < self_season_end
    end

    # [ ] ( )

    if self_season_end && pricing_season_end
      # [ ( ]
      return true if self_season_start < pricing_season_start && pricing_season_start < self_season_end
      # [ ) ]
      return true if pricing_season_start < self_season_end && self_season_end < pricing_season_end
      # ( [ ] )
      return true if pricing_season_start < self_season_start && pricing_season_end < self_season_end
    end

    false
  end
end

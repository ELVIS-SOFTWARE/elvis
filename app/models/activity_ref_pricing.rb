# frozen_string_literal: true

class ActivityRefPricing < ApplicationRecord
  acts_as_paranoid
  belongs_to :activity_ref
  belongs_to :from_season, class_name: :Season, optional: false
  belongs_to :to_season, class_name: :Season, optional: true
  belongs_to :pricing_category
  has_many :packs

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

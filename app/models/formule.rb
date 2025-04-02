class Formule < ApplicationRecord
  acts_as_paranoid
  has_many :formule_pricings, dependent: :destroy
  has_many :formule_items, dependent: :destroy
  has_many :activity_applications

  has_many :activity_refs, through: :formule_items, source: :item, source_type: "ActivityRef"
  has_many :activity_ref_kinds, through: :formule_items, source: :item, source_type: "ActivityRefKind"

  validates :name, presence: true
  validates :number_of_items, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }

  has_many :max_prices, as: :target, dependent: :destroy, class_name: "MaxActivityRefPriceForSeason"

  # validate count of items equals to number_of_items
  validate :validate_number_of_items

  def self.display_class_name(singular= true)
    singular ? "Formule" : "Formules"
  end

  def self.class_name_gender
    return :F
  end

  def display_price(season = Season.current_apps_season || Season.current)
    Elvis::CacheUtils.cache_block_if_enabled("formules_#{id}_price_#{season.id}", expires_in: Parameter.get_value("app.cache.max_price.duration") || 5.minutes) do
      max_prices.find_by(season_id: season.id)&.price || 0
    end
  end

  def display_prices_by_season
    Season.all_seasons_cached.each_with_object({}) do |season, hash|
      hash[season.id] = display_price(season)
    end
  end

  def activities
    activity_refs + activity_ref_kinds
  end

  private

  def validate_number_of_items
    total_activities_count = 0

    formule_items.each do |item|
      if item.item_type == "ActivityRefKind"
        # Pour chaque famille, compter le nombre d'activités qu'elle contient
        kind = ActivityRefKind.find(item.item_id)
        total_activities_count += ActivityRef.where(activity_ref_kind_id: kind.id).count
      else
        # Pour les activités individuelles, compter 1
        total_activities_count += 1
      end
    end

    # Vérifier que le nombre d'activités à choisir ne dépasse pas le total des activités disponibles
    if number_of_items > total_activities_count
      errors.add(:number_of_items, "ne peut pas dépasser le nombre total d'activités disponibles (#{total_activities_count})")
    end

    # Vérifier qu'il y a au moins une activité
    if formule_items.empty?
      errors.add(:base, "La formule doit contenir au moins une activité ou famille d'activités")
    end
  end
end

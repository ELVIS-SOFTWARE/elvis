# frozen_string_literal: true

class FormulesMaxPriceCalculator < ApplicationJob
  queue_as :default

  def perform(*_args)
    @season = _args[0] if _args[0].is_a?(Season)
    @seasons = Season.all_seasons_cached

    pricings_by_formules = fetch_pricings

    result = compute_max_prices(pricings_by_formules)

    max_pricings_to_save = []

    result.each do |formule_id, hash|
      next if formule_id.nil?

      hash.each do |season_id, max_price|
        next if season_id.nil? || max_price.nil?

        pricing_to_save = MaxActivityRefPriceForSeason.find_or_initialize_by(season_id: season_id, target_id: formule_id, target_type: "Formule")

        pricing_to_save.price = max_price
        max_pricings_to_save << pricing_to_save
      end
    end

    date_now = DateTime.now

    return if max_pricings_to_save.empty?

    MaxActivityRefPriceForSeason.transaction do
      MaxActivityRefPriceForSeason.upsert_all(
        max_pricings_to_save.map do |p|
          {
            season_id: p.season_id,
            target_id: p.target_id,
            target_type: p.target_type,
            price: p.price,
            updated_at: date_now,
            created_at: p.created_at || date_now
          }
        end,
        unique_by: [:season_id, :target_id, :target_type], returning: false
      )
    end
  end

  def fetch_pricings
    pricings_by_formules = FormulePricing
                 .select("
                      formule_pricings.id,
                      formule_pricings.formule_id,
                      formule_pricings.price,
                      formule_pricings.pricing_category_id,
                      formule_pricings.from_season_id,
                      from_seasons.start as from_season_start,
                      formule_pricings.to_season_id,
                      to_seasons.end as to_season_end
                      ")
                 .joins("right join formules on formules.id = formule_pricings.formule_id")
                 .joins("inner join seasons as from_seasons on formule_pricings.from_season_id = from_seasons.id")
                 .joins("left join seasons as to_seasons on formule_pricings.to_season_id = to_seasons.id or formule_pricings.to_season_id is null")
                 .group_by(&:formule_id)

    if @season.is_a?(Season)
      pricings_by_formules = pricings_by_formules.for_season(@season)
    end

    pricings_by_formules
  end

  def compute_max_prices(pricings_by_formules)
    max_ar_pricings_by_season = {}

    pricings_by_formules.each do |formule_id, pricings|
      compute_max_price_for_formules(formule_id, max_ar_pricings_by_season, pricings)
    end

    max_ar_pricings_by_season
  end

  def compute_max_price_for_formules(formule_id, max_pricings_by_season, pricings)
    max_pricings_by_season[formule_id] = {}

    @seasons.each do |season|
      max_price = compute_max_price_for_formule(pricings, season)

      max_pricings_by_season[formule_id][season.id] = max_price
    end

    max_pricings_by_season
  end

  def compute_max_price_for_formule(pricings, season)
    pricings
      .select { |p|
        p.from_season_start <= season.start &&
          (p.to_season_id.nil? || p.to_season_end >= season.start) }
      .map(&:price)
      .max || 0
  end
end

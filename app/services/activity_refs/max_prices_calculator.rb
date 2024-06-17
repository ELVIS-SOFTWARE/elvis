# frozen_string_literal: true

module ActivityRefs

  # Service qui calcule les tarifs max pour toutes les activités et les familles d'activités et les stocke en cache (durée 5 minutes)
  #  Ce service est créé dans un objectif de performance : il évite de faire des requêtes SQL à chaque fois que l'on veut afficher un tarif
  class MaxPricesCalculator

    # @param [Season] season la saison pour laquelle calculer les tarifs ou omis pour toutes les saisons
    def initialize(season = nil, duration = 5.minutes)
      @season = season
      @seasons = Season.all_seasons_cached
      @duration = duration
    end

    def call
      pricings = fetch_pricings
      group_pricings_by_activity_ref_result = group_pricings_by_activity_ref(pricings)

      compute_and_cache_max_prices(group_pricings_by_activity_ref_result)
    end

    private

    def compute_and_cache_max_prices(group_pricings_by_activity_ref_result)
      max_ar_pricings_by_season = {}
      max_ar_kind_pricings_by_season = {}

      pricings_by_ar = group_pricings_by_activity_ref_result[0]
      activity_ref_substitutable = group_pricings_by_activity_ref_result[1]

      pricings_by_ar.each do |activity_ref_id, pricings|
        current_activity_ref_is_substitutable = activity_ref_substitutable[activity_ref_id]

        compute_and_cache_max_price_for_activity_ref(activity_ref_id, max_ar_kind_pricings_by_season, max_ar_pricings_by_season, pricings, current_activity_ref_is_substitutable)
      end
    end

    def compute_and_cache_max_price_for_activity_ref(activity_ref_id, max_ar_kind_pricings_by_season, max_pricings_by_season, pricings, current_activity_ref_is_substitutable)
      max_pricings_by_season[activity_ref_id] = {}

      ar_kind_id = if pricings.any?
                     pricings.first.activity_ref_kind_id
                   else
                     nil
                   end
      max_ar_kind_pricings_by_season[ar_kind_id] ||= {}

      @seasons.find_each do |season|
        max_price = compute_max_price_for_activity_ref(pricings, season)
        cache_max_price_for_activity_ref(activity_ref_id, max_price, season)

        if current_activity_ref_is_substitutable
          update_max_price_for_activity_ref_kind(ar_kind_id, max_ar_kind_pricings_by_season, max_price, season)
        end
      end

      cache_max_prices_for_activity_ref_kinds(max_ar_kind_pricings_by_season)
    end

    def update_max_price_for_activity_ref_kind(ar_kind_id, max_ar_kind_pricings_by_season, max_price, season)
      max_ar_kind_pricings_by_season[ar_kind_id][season.id] ||= 0
      if max_price > max_ar_kind_pricings_by_season[ar_kind_id][season.id]
        max_ar_kind_pricings_by_season[ar_kind_id][season.id] = max_price
      end
    end

    def cache_max_price_for_activity_ref(activity_ref_id, max_price, season)
      Rails.cache.write(
        "activity_ref_id:#{activity_ref_id}:#{season.id}:price", max_price,
        expires_in: @duration)
    end

    def compute_max_price_for_activity_ref(pricings, season)
      pricings
        .select { |p|
          p.from_season_start <= season.start &&
            (p.to_season_id.nil? || p.to_season_end >= season.start) }
        .map(&:price)
        .max || 0
    end

    def cache_max_prices_for_activity_ref_kinds(max_ar_kind_pricings_by_season)
      max_ar_kind_pricings_by_season.each do |ar_kind_id, hash|
        hash.each do |season_id, max_price|
          Rails.cache.write(
            "activity_ref_kind_id:#{ar_kind_id}:#{season_id}:price", max_price,
            expires_in: @duration)
        end
      end
    end

    def fetch_pricings
      pricings = ActivityRefPricing
                   .select("
                      activity_ref_pricings.id,
                      activity_ref_pricings.activity_ref_id,
                      activity_refs.activity_ref_kind_id,
                      activity_ref_pricings.price,
                      activity_ref_pricings.pricing_category_id,
                      activity_ref_pricings.from_season_id,
                      from_seasons.start as from_season_start,
                      activity_ref_pricings.to_season_id,
                      to_seasons.end as to_season_end
                      ")
                   .joins("right join activity_refs on activity_refs.id = activity_ref_pricings.activity_ref_id")
                   .joins("inner join seasons as from_seasons on activity_ref_pricings.from_season_id = from_seasons.id")
                   .joins("left join seasons as to_seasons on activity_ref_pricings.to_season_id = to_seasons.id or activity_ref_pricings.to_season_id is null")
                   .where("activity_ref_pricings.deleted_at is null")

      if @season.is_a?(Season)
        pricings = pricings.for_season(@season)
      end
      pricings
    end

    def group_pricings_by_activity_ref(pricings)
      pricings_by_ar = {}
      activity_ref_substitutable = {}

      # initialize the hash with empty arrays for each activity_ref_id
      ActivityRef.with_deleted.pluck(:id, :substitutable).each do |activity_ref_data|
        pricings_by_ar[activity_ref_data[0]] = []
        activity_ref_substitutable[activity_ref_data[0]] = activity_ref_data[1]
      end

      # fill the hash with the pricings
      pricings.find_each do |pricing|
        pricings_by_ar[pricing.activity_ref_id] << pricing
      end

      [pricings_by_ar, activity_ref_substitutable]
    end

  end
end
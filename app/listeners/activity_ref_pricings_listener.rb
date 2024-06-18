# frozen_string_literal: true

class ActivityRefPricingsListener < BaseListener

  def self.remove_cache(season_id)
    Rails.cache.delete("activity_refs_packs:season_#{season_id}")
  end

  def self.remove_cache_for(from_season_id, to_season_id)
    remove_cache(from_season_id)

    if to_season_id
      remove_cache(to_season_id)
      s = Season.find_by(id: to_season_id)

      while s.present? && s.id != from_season_id && s.previous
        s = s.previous

        remove_cache(s&.id)
      end
    end
  end

  def self.subscribe
    event_ids ||= []

    event_ids << EventHandler.activity_ref_pricing.create.subscribe(true) do |sender:, args:|
      model = args[:model]

      remove_cache_for(model.from_season_id, model.to_season_id)
    end

    event_ids << EventHandler.activity_ref_pricing.update.subscribe(true) do |sender:, args:|
      model = args[:model]

      remove_cache_for(model.from_season_id, model.to_season_id)
    end

    event_ids << EventHandler.activity_ref_pricing.destroy.subscribe(true) do |sender:, args:|
      model = args[:model]

      remove_cache_for(model.from_season_id, model.to_season_id)
    end

  end
end

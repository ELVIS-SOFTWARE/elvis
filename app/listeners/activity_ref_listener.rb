# frozen_string_literal: true

class ActivityRefListener < BaseListener

  def self.subscribe
    event_ids ||= []

    event_ids << EventHandler.activity_ref_pricing.create.subscribe(true) do |sender:, args:|
      ActivityRef.erase_all_display_price_cache
    end

    event_ids << EventHandler.activity_ref_pricing.destroy.subscribe(true) do |sender:, args:|
      ActivityRef.erase_all_display_price_cache
    end

    event_ids << EventHandler.activity_ref_pricing.update.subscribe(true) do |sender:, args:|
      ActivityRef.erase_all_display_price_cache
    end
  end
end

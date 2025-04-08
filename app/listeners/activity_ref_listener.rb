# frozen_string_literal: true

class ActivityRefListener < BaseListener

  def self.subscribe
    event_ids ||= []

    event_ids << EventHandler.formule_pricing.create.subscribe(true) do |sender:, args:|
      FormulesMaxPriceCalculator.perform_later(nil)
    end

    event_ids << EventHandler.formule_pricing.destroy.subscribe(true) do |sender:, args:|
      FormulesMaxPriceCalculator.perform_later(nil)
    end

    event_ids << EventHandler.formule_pricing.update.subscribe(true) do |sender:, args:|
      FormulesMaxPriceCalculator.perform_later(nil)
    end
  end
end

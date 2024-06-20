# frozen_string_literal: true

class ActivityRefListener < BaseListener

  def self.subscribe
    event_ids ||= []

    event_ids << EventHandler.activity_ref_pricing.create.subscribe(true) do |sender:, args:|
      MaxPricesCalculatorJob.perform_later(nil)
    end

    event_ids << EventHandler.activity_ref_pricing.destroy.subscribe(true) do |sender:, args:|
      MaxPricesCalculatorJob.perform_later(nil)
    end

    event_ids << EventHandler.activity_ref_pricing.update.subscribe(true) do |sender:, args:|
      MaxPricesCalculatorJob.perform_later(nil)
    end
  end
end

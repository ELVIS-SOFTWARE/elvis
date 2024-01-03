# frozen_string_literal: true

require_relative 'base_listener'

class BddListeners < BaseListener

  def self.subscribe
    return unless EventSubscription.table_exists?

    EventSubscription.all.each do |event_subscription|
      event_subscription.subscribe_id = nil
      event_subscription.subscribe
    end

  rescue StandardError => e
    # ne peut pas utiliser Rails.logger car il n'est pas encore initialisé
    puts "Error while subscribing to dbb events: #{e.message}}"
  end

end
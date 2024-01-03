# frozen_string_literal: true
require_relative '../../lib/elvis/event_handler'
require_relative '../../app/listeners/base_listener'

Rails.configuration.to_prepare do
  if Rails.configuration.respond_to?(:event_store) && Rails.configuration.event_store.present?
    puts 'event store already configured'
  else
    Rails.configuration.event_store = RailsEventStore::JSONClient.new
  end

  puts 'load listeners'

  Dir.entries("#{Rails.root}/app/listeners").each do |file|
    next if file == '.' || file == '..' || file == 'base_listener.rb'

    require_relative "#{Rails.root}/app/listeners/#{file}"
  end

  puts 'listeners loaded, subscribing'

  BaseListener.subclasses.each(&:subscribe)

  puts 'listeners subscribed'
end
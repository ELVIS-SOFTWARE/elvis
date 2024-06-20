# frozen_string_literal: true

class ParameterListner < BaseListener
  def self.subscribe
    event_ids ||= []

    event_ids << EventHandler.parameter.create.subscribe(true) do |sender:, args:|
      model = args[:model]

      Rails.cache.delete("parameter_#{model.label}")
    end

    event_ids << EventHandler.parameter.update.subscribe(true) do |sender:, args:|
      model = args[:model]

      Rails.cache.delete("parameter_#{model.label}")
    end

    event_ids << EventHandler.parameter.destroy.subscribe(true) do |sender:, args:|
      model = args[:model]

      Rails.cache.delete("parameter_#{model.label}")
    end
  end
end

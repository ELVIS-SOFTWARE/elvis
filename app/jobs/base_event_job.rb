# frozen_string_literal: true

class BaseEventJob < ActiveJob::Base
  prepend RailsEventStore::AsyncHandler

  # Need to be async because sub classes defined in main process ==> Rework of async event needed
  self.queue_adapter = :async

  class_attribute :block
  class_attribute :custom_class_name

  def perform(event)
    sender = event.data.fetch(:sender)
    args = event.data.fetch(:args)

    self.block.call(sender: sender, args: args)
  end

  private

  def event_store
    Rails.configuration.event_store
  end
end

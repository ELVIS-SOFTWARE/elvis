# frozen_string_literal: true

class BaseListener
  class_attribute :event_ids

  def self.subscribe; end
end
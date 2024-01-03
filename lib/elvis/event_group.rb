# frozen_string_literal: true
require_relative 'event'

class EventGroup

  def initialize(name)
    @semaphore = Mutex.new
    @name = name
  end

  def name
    @name
  end

  # @return [Event]
  def method_missing(method, *args)
    src = <<~END_SRC
      def #{method}(*args)
        @#{method} ||= Event.new("#{@name}_#{method}")
      end
    END_SRC

    @semaphore.synchronize do
      begin
        class_eval src, __FILE__, __LINE__
      rescue StandardError => e
        Rails.logger.error e
      end

      send(method, *args)
    end
  end
end

# frozen_string_literal: true
require_relative 'event_group'

#noinspection RubyClassVariableUsageInspection
class EventHandler

  @@semaphore = Mutex.new

  # @return [EventGroup]
  def self.method_missing(method, *args)
    src = <<~END_SRC
      def self.#{method}(*args)
        @#{method} ||= EventGroup.new(:#{method})
      end
    END_SRC

    @@semaphore.synchronize do
      begin
        class_eval src, __FILE__, __LINE__
      rescue StandardError => e
        Rails.logger.error e
      end

      send(method, *args)
    end
  end
end
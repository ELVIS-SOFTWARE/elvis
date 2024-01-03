# frozen_string_literal: true

class BaseRendererError < StandardError

  attr_accessor :sup_message

  def initialize(message, code)
    super(message)

    @code = code
  end

  def code
    @code
  end

  def with_message(message)
    duplicated = self.dup

    duplicated.sup_message = message

    duplicated
  end
end


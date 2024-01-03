# frozen_string_literal: true

class ErrorRegisterJob < ApplicationJob

  def perform(args)
    ErrorHistory.create!(args)
  end

end

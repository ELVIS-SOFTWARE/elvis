# frozen_string_literal: true

class UpdateApplicationUrlUsageJob < ApplicationJob
  queue_as :default

  def perform(*args)
    url_string = args[0]
    date_time_string = args[1]

    url_model = ApplicationUrl.find_or_create_by!(url: url_string)

    url_model.last_used_at = DateTime.parse(date_time_string)

    if ApplicationUrl.where(is_main: true).any?
      url_model.save
    else
      url_model.is_main = true

      url_model.save
      ApplicationUrl.reset_main_root_url_cache
    end



  rescue StandardError => e
    Rails.logger.error e.message
  end
end

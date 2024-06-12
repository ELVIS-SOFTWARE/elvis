# frozen_string_literal: true

sidekiq_redis_url = ENV['SIDEKIQ_REDIS_URL'] || ENV['REDIS_URL']

unless sidekiq_redis_url.nil?
  redis_config = {
    url: sidekiq_redis_url,
    namespace: "#{ENV['INSTANCE_NAME'] || "development"}-#{Rails.env}-sidekiq"
  }

  Sidekiq.configure_server do |config|
    config.redis = redis_config
  end

  Sidekiq.configure_client do |config|
    config.redis = redis_config
  end
end
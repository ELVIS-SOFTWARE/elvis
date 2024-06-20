# frozen_string_literal: true
sidekiq_redis_url = ENV['SIDEKIQ_REDIS_URL'] || ENV['REDIS_URL']

if ENV["USE_SIDEKIQ"] == "true" && !sidekiq_redis_url.nil?
  require 'sidekiq/web'

  redis_config = {
    url: sidekiq_redis_url
  }

  Sidekiq.configure_server do |config|
    config.redis = redis_config
  end

  Sidekiq.configure_client do |config|
    config.redis = redis_config
  end

  Rails.application.config.after_initialize do
    Rails.application.routes.draw do
      authenticate :user, lambda { |u| u.admin? } do
        mount Sidekiq::Web => '/sidekiq'
      end
    end
  end
end

Rails.application.config.after_initialize do
  if Rails.env.development? || (Rails.env.kubernetes? && ENV["kube_env"] == "start")
    begin
      MaxPricesCalculatorJob.perform_later(nil)
    rescue StandardError
      # Ignored
    end
  end
end
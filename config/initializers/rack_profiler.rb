# frozen_string_literal: true

if Rails.env.development? || ENV['RACK_MINI_PROFILER'] == 'true'
  require "rack-mini-profiler"

  # initialization is skipped so trigger it
  Rack::MiniProfilerRails.initialize!(Rails.application)

  unless Rails.env.development?

    unless ENV['RACK_MINI_PROFILER_REDIS_URL'].nil?
      Rack::MiniProfiler.config.storage_options = {
        url: ENV['RACK_MINI_PROFILER_REDIS_URL'],
        ssl_params: { verify_mode: OpenSSL::SSL::VERIFY_NONE }
      }
      Rack::MiniProfiler.config.storage = Rack::MiniProfiler::RedisStore
    end

    Rack::MiniProfiler.config.authorization_mode = :allow_authorized
  end
end

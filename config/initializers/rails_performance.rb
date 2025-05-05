RailsPerformance.setup do |config|
  config.debug = false # currently not used>
  config.enabled = !ENV['REDIS_URL'].nil? && (Rails.env.kubernetes? || ENV['RAILS_PERFORMANCE_ENABLED'] == 'true')

  redis = Redis.new(url: ENV['REDIS_URL'])

  config.redis = Redis::Namespace.new("#{ENV['INSTANCE_NAME'] || "development"}-#{Rails.env}-rails-performance", redis: redis)
  config.duration = (ENV['RAILS_PERFORMANCE_DURATION'] || "4").to_i.hours

  # default path where to mount gem
  config.mount_at = '/rails/performance'

  # protect your Performance Dashboard with HTTP BASIC password
  config.http_basic_authentication_enabled = Rails.env.production? || Rails.env.kubernetes?
  config.http_basic_authentication_user_name = ENV['RAILS_PERFORMANCE_USER'] || 'elvis'
  config.http_basic_authentication_password = ENV['RAILS_PERFORMANCE_PASSWORD'] || 'presley'

  # if you need an additional rules to check user permissions
  config.verify_access_proc = proc { |controller| true }
  # for example when you have `current_user`
  # config.verify_access_proc = proc { |controller| controller.current_user && controller.current_user.admin? }

  # You can ignore endpoints with Rails standard notation controller#action
  config.ignored_endpoints = %w[HealthcheckController#index PingController#index]

  # store custom data for the request
  # config.custom_data_proc = proc do |env|
  #   request = Rack::Request.new(env)
  #   {
  #     email: request.env['warden'].user&.email, # if you are using Devise for example
  #     user_agent: request.env['HTTP_USER_AGENT']
  #   }
  # end

  # config home button link
  config.home_link = '/'
  config.skipable_rake_tasks = %w[shakapacker:compile assets:precompile db:prepare elvis:plugins:discover elvis:plugins:migrate chewy:upgrade]
  config.include_rake_tasks = false
  config.include_custom_events = true
end if defined?(RailsPerformance)

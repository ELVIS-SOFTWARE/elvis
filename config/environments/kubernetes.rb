##########################################################
# Ce fichier est dédié à l'environnement de prod d'ELVIS
##########################################################

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.
  #
  config.webpacker.check_yarn_integrity = false

  # Code is not reloaded between requests.
  config.cache_classes = true

  # Eager load code on boot. This eager loads most of Rails and
  # your application in memory, allowing both threaded web servers
  # and those relying on copy on write to perform better.
  # Rake tasks automatically ignore this option for performance.
  config.eager_load = true

  # Full error reports are disabled and caching is turned on.
  config.consider_all_requests_local       = false
  config.action_controller.perform_caching = true

  # Attempt to read encrypted secrets from `config/secrets.yml.enc`.
  # Requires an encryption key in `ENV["RAILS_MASTER_KEY"]` or
  # `config/secrets.yml.key`.
  config.read_encrypted_secrets = true

  # Disable serving static files from the `/public` folder by default since
  # Apache or NGINX already handles this.
  config.public_file_server.enabled = ENV["RAILS_SERVE_STATIC_FILES"].present?

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # config.action_controller.asset_host = 'http://assets.example.com'

  # Specifies the header that your server uses for sending files.
  # config.action_dispatch.x_sendfile_header = 'X-Sendfile' # for Apache
  # config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect' # for NGINX

  # Mount Action Cable outside main process or domain
  # config.action_cable.mount_path = nil
  # config.action_cable.url = 'wss://example.com/cable'
  # config.action_cable.allowed_request_origins = [ 'http://example.com', /http:\/\/example.*/ ]

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  # config.force_ssl = true

  # Use a different cache store in production.
  if !ENV["REDIS_URL"].nil? && ENV["USE_REDIS_FOR_CACHING"] == "true"
    config.cache_store = :redis_cache_store, {
      url: ENV["REDIS_URL"],
      namespace: "#{ENV['INSTANCE_NAME'] || "development"}-#{Rails.env}-cache_store"
    }
  else
    config.cache_store = :memory_store
  end

  # config.active_job.queue_name_prefix = "rails-starter_#{Rails.env}"
  config.action_mailer.perform_caching = false
  config.action_mailer.default_url_options = { host: ENV["SMTP_DOMAIN"] }
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = {
    port: ENV["SMTP_PORT"],
    address: ENV["SMTP_URL"],
    user_name: ENV["SMTP_ACCESS_KEY"],
    password: ENV["SMTP_SECRET_KEY"],
    authentication: :login,
    enable_starttls_auto: true
  }

  # Ignore bad email addresses and do not raise email delivery errors.
  # Set this to true and configure the email server for immediate delivery to raise delivery errors.
  # config.action_mailer.raise_delivery_errors = false

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Send deprecation notices to registered listeners.
  # config.active_support.deprecation = :notify

  ##################
  ## LOGGING
  ##################
  # Use the lowest log level to ensure availability of diagnostic information
  # when problems arise.
  config.log_level = :info

  # Use default logging formatter so that PID and timestamp are not suppressed.
  # config.log_formatter = ::Logger::Formatter.new

  # Use a different logger for distributed setups.
  # require 'syslog/logger'
  # config.logger = ActiveSupport::TaggedLogging.new(Syslog::Logger.new 'app-name')
  # config.lograge.enabled = true
  # config.lograge.custom_options = lambda do |event|
  #   {
  #     instance: ENV["INSTANCE_SLUG"],
  #     exception: event.payload[:exception]&.first,
  #     request_id: event.payload[:headers]["action_dispatch.request_id"]
  #   }
  # end

  config.rails_semantic_logger.format = :logfmt
  config.semantic_logger.backtrace_level = :error
  config.rails_semantic_logger.quiet_assets = true
  config.rails_semantic_logger.started = true
  config.colorize_logging = true

  if ENV["RAILS_LOG_TO_STDOUT"].present?
    # logger           = ActiveSupport::Logger.new(STDOUT)
    # logger.formatter = config.log_formatter
    # config.logger    = ActiveSupport::TaggedLogging.new(logger)
    $stdout.sync = true
    config.rails_semantic_logger.add_file_appender = false
    config.semantic_logger.add_appender(io: $stdout, formatter: :logfmt)
  end

  # Prepend all log lines with the following tags.
  config.log_tags = {
    request_id: :request_id,
    instance: ENV["INSTANCE_SLUG"]
  }

  ##################
  ## ACTIVE STORAGE
  ##################
  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  #  ActiveStorage
  # config.active_storage.service = :local

  if ENV["STORAGE_ACCOUNT"].nil?
    # by default use amazon or azure services. amazon by default and azure if AZURE_STORAGE_ACCOUNT is set
    config.active_storage.service = ENV["AZURE_STORAGE_ACCOUNT"].nil? ? :amazon : :azure # for compatibility with existing apps, to remove where not needed
  else
    config.active_storage.service = ENV["STORAGE_ACCOUNT"].to_sym
  end

  config.session_store :cookie_store, same_site: :lax

  ##################
  ## ACTIVE JOB
  ##################
  # Use a real queuing backend for Active Job (and separate queues per environment)
  config.active_job.queue_adapter = ENV["USE_SIDEKIQ"] == "true" ? :sidekiq : :async

  Recaptcha.configure do |config|
    config.site_key = ENV["SITE_KEY"]
    config.secret_key = ENV["SECRET_KEY"]
  end

  # redis_conn = proc {
  #   Redis.current = Redis.new({
  #                               url: "redis://mymaster",
  #                               role: :master,
  #                               sentinels: [{ host: "rfs-redisfailover.elvis.svc", port: 26_379 }]
  #                             })
  # }

  # Sidekiq.configure_client do |config|
  #   config.redis = ConnectionPool.new(size: 5, &redis_conn)
  # end

  # Sidekiq.configure_server do |config|
  #   config.redis = ConnectionPool.new(size: 25, &redis_conn)
  # end
end

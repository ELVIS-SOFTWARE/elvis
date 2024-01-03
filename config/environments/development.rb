Rails.application.configure do
  config.webpacker.check_yarn_integrity = false  # Settings specified here will take precedence over those in config/application.rb.

  config.web_console.permissions = "0.0.0.0/0"
  # In the development environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports.
  config.consider_all_requests_local = true

  # Enable/disable caching. By default caching is disabled.
  if Rails.root.join("tmp/caching-dev.txt").exist?
    config.action_controller.perform_caching = true

    config.cache_store = :memory_store
    config.public_file_server.headers = {
      "Cache-Control" => "public, max-age=#{2.days.seconds.to_i}"
    }
  else
    config.action_controller.perform_caching = false

    config.cache_store = :null_store
  end

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = true

  config.action_mailer.perform_caching = false

  #config.action_mailer.delivery_method = :file
  #config.action_mailer.file_settings = { location: Rails.root.join("tmp/mail") }
  config.action_mailer.delivery_method = :letter_opener
  config.action_mailer.perform_deliveries = true

  config.action_mailer.default_url_options = { host: "localhost", port: 5000 }

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Raise an error on page load if there are pending migrations.
  config.active_record.migration_error = :page_load

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  #  ActiveStorage
  config.active_storage.service = :local

  Chewy.request_strategy = :bypass
  config.log_level = :debug

  config.session_store :cookie_store, same_site: :lax
  config.active_job.queue_adapter = :async

  config.middleware.use RequestStore::Middleware

  Recaptcha.configure do |config|
    config.site_key = ""
    config.secret_key = ""
  end

  config.after_initialize do
    ENV["INSTANCE_NAME"] = "elvis-salsa"
  #   Bullet.enable = true
  #   Bullet.sentry = true
  #   # Bullet.alert = true
  #   Bullet.bullet_logger = true
  #   Bullet.console = true
  #   Bullet.rails_logger = true
  #   Bullet.add_footer = true
  end
end



Sidekiq.logger = Logger.new(STDOUT)

require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
# require "action_mailbox/engine"
# require "action_text/engine"
require "action_view/railtie"
require "action_cable/engine"
require_relative "../lib/elvis/version"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

class TrueClass; def to_i; 1 end end
class FalseClass; def to_i; 0 end end

module RailsStarter
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.0
    config.autoloader = :zeitwerk

    config.autoload_paths += [Rails.root.join("lib")]

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Don't generate system test files.
    config.generators.system_tests = nil

    config.middleware.use Rack::Deflater

    config.time_zone = "Paris"

    config.i18n.default_locale = :fr

    config.active_job.queue_adapter = :sidekiq

    # TODO env var

    if Rails.env.kubernetes?
      config.action_mailer.asset_host = "https://#{ENV['DOMAIN']}/"
    else
      config.action_mailer.asset_host = "http://localhost:5000/"
    end


  end
end

I18n.enforce_available_locales = false
I18n.config.available_locales = :fr

require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
require "action_cable/engine"
require "sprockets/railtie"
require 'active_support/core_ext'
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
    config.middleware.use Rack::Deflater
    config.load_defaults 5.1
    config.autoloader = :zeitwerk

    config.autoload_paths += [Rails.root.join("lib")]

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Don't generate system test files.
    config.generators.system_tests = nil
    config.generators do |g|
        g.test_framework false
        g.stylesheets    false
        g.javascripts    false
        g.helper         false
        g.channel        assets: false
    end

    config.time_zone = "Paris"

    config.i18n.default_locale = :fr

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

require "elvis/plugin_loader"
require 'concurrent'

  class PluginInitJob < ApplicationJob
    # need to be async because it define && require plugins
    self.queue_adapter = :async

  def initialize
    super

    @logger = Logger.new($stdout)
  end

  def perform
    pp "start plugins db_load & load"

    plugin_assets_reloader = nil

    begin
      Elvis::PluginLoader.db_load
      # Elvis::PluginLoader.load

      param = Parameter.find_by label: "system.show_plugins"

      if param.nil?
        param = Parameter.new

        param.label = "system.show_plugins"
        param.value = 0
        param.value_type = "int"

        param.save
      end

      plugin_assets_reloader = Elvis::PluginLoader.create_assets_reloader

      Rails.application.reloaders << plugin_assets_reloader

    rescue StandardError => e
      pp "Erreur dans load_plugins"
      @logger.error "#{e}\n#{e.backtrace.join("\n")}"
    end

    # TODO à restaurer
    # unless Elvis::Configuration['mirror_plugins_assets_on_startup'] == false
    #   plugin_assets_reloader.execute
    # end

    begin
      plugin_assets_reloader&.execute_if_updated
    rescue StandardError => e
      @logger.error "#{e}\n#{e.backtrace.join("\n")}"
    end
    pp "plugins loads finish"
  end

  def self.migrate_plugins
    Plugin.where.not(activated_at: nil).each do |plugin|
      plugin.migrate
    rescue StandardError => e
      Logger.new($stderr).error "#{e}\n#{e.backtrace.join("\n")}"
    end
  end
end

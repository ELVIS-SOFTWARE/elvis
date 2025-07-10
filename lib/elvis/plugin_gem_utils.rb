# frozen_string_literal: true

require 'net/http'
require 'json'

require_relative 'version'

class PluginGemUtils
  class << self

    # @return [Array<PluginGemObject>]
    def get_plugins_to_install(include_libraries: false)
      plugins_list_download_url = ENV['PLUGINS_LIST_DOWNLOAD_URL']

      begin
        if plugins_list_download_url.nil? || "#{plugins_list_download_url}".strip.length == 0
          plugins_json = JSON.parse(File.read("plugins.json"))
        else
          plugins_list_download_url = "#{plugins_list_download_url}#{plugins_list_download_url.split("/").last.include?("?") ? "&" : "?"}elvisVersion=#{Elvis::VERSION}"
          plugins_json = JSON.parse(Net::HTTP.get(URI(plugins_list_download_url)))
        end

      rescue StandardError => e
        if ENV['LOG_PLUGINS_BACKTRACE_ERRORS'] == "true"
          puts "Error while reading plugins.json: #{e.message}\n#{e.backtrace&.join("\n")}"
        else
          if plugins_list_download_url.nil? || "#{plugins_list_download_url}".strip.length == 0
            puts "Error in plugins.json file (not found or invalid json or permission denied) ==> no plugins will be considered"
          else
            puts "Error while reading plugins from #{plugins_list_download_url} ==> no plugins will be considered"
          end
        end

        plugins_json = []
      end

      plugins_json.map do |plugin_json|
        next if !include_libraries && plugin_json['isLibrary'] == true

        plugin = PluginGemObject.new

        plugin.name = plugin_json['name']
        plugin.full_url = plugin_json['fullUrl']
        plugin.hidden = plugin_json['hidden']
        plugin.branch = plugin_json['branch']
        plugin.tag = plugin_json['tag']
        plugin.auto_activate = plugin_json['autoActivate']
        plugin.is_library = plugin_json['isLibrary']

        plugin
      end.compact
    end

    def get_plugins_installed(include_libraries: false)
      plugins = get_plugins_to_install(include_libraries: include_libraries)

      plugins.filter do |plugin|
        plugin.installed_path = `bundle show #{plugin.name}`.strip

        plugin.installed_path.length > 0
      end

      plugins
    end
  end

  class PluginGemObject
    attr_accessor :name, :full_url, :hidden, :branch, :tag, :auto_activate, :is_library, :installed_path

    def to_h
      {
        name: name,
        full_url: full_url,
        hidden: hidden,
        branch: branch,
        tag: tag,
        auto_activate: auto_activate
      }
    end

    def is_from_tag?
      tag.nil? == false && tag.length > 0 # present? not existing in base ruby implementation ==> it's a rails thing
    end
  end
end

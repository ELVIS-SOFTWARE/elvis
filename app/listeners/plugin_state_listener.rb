# frozen_string_literal: true

require_relative 'base_listener'

class PluginStateListener < BaseListener

  def self.subscribe
    event_ids ||= []

    event_ids << EventHandler.plugins_state.changed.subscribe(true) do |sender:, args:|
      plugins = Plugin.where(id: args[:plugin_ids])

      plugins.each do |plugin|

        EventHandler.send(plugin.name.start_with?("plugin_") ? plugin.name : plugin.name.prepend("plugin_")).send(plugin.activated_at.nil? ? :deactivated : :activated).trigger(
          sender: self.class.name,
          args: plugin.as_json.except("id", "download_gem_link", "partial", "hidden")
        )
      end
    end
  end
end

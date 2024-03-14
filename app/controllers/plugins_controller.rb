class PluginsController < ApplicationController
  before_action :set_current_user

  def index
    respond_to do |format|
      format.html
      format.json { render json: {
        plugins: Plugin.where(hidden: false),
      } }
    end
  end

  def changed
    plugin_changed = []

    plugins = Plugin.where(id: params[:data].keys).to_a

    plugins.each do |plugin|
      if params[:data][plugin.id.to_s]
        plugin.activated_at = DateTime.now if plugin.activated_at.nil?
      else
        plugin.activated_at = nil

        if params[:rollback] == "on"
          plugin.migrations.reverse.each do |m|
            plugin.rollback m
          end
        end
      end

      plugin_changed << plugin if plugin.changed?

      # save plugin ; ignore potential error to process further
      plugin.save
    end

    if plugin_changed.any?
      EventHandler.plugins_state.changed.trigger(
        sender: self.class.name,
        args: {
          plugin_ids: plugin_changed.map(&:id)
        }
      )

      PluginInitJob.migrate_plugins

      restart = File.open(File.join(Rails.root, "tmp", "restart.txt"), "w")
      restart.write "restart"
      restart.close
    end

    respond_to do |format|
      format.html { redirect_to action: :index }
      format.json { render json: { restart: plugin_changed.any? } }
    end
  end
end

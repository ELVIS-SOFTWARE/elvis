class PluginsController < ApplicationController
  before_action :set_current_user

  def index
    @is_restarted = flash[:restart] == 1

    @plugins = Plugin.where(hidden: false).to_a unless @is_restarted

    respond_to do |format|
      format.html
      format.json { render json: {
        plugins: @plugins,
      } }
    end
  end

  def changed
    if params[:data].present?
      plugin_changed = []

      params[:data].each do |plugin_id, updated_status|

        plugin = Plugin.find_by(id: plugin_id, hidden: false)

        if updated_status
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

      flash[:restart] = 1
      redirect_to action: :index
    end
  end

  private

  def plugins_params
    params[:activated]
  end
end

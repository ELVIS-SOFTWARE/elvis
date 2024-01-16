# frozen_string_literal: true

module Elvis
  class PluginPath
    attr_reader :assets_dir, :initializer

    def initialize(dir, plugin_name = nil)
      @dir = dir
      @assets_dir = File.join dir, "assets"
      @initializer = File.join dir, "init.rb"
      @plugin_name = plugin_name
    end

    def run_initializer
      load initializer if has_initializer?
    end

    def to_s
      @dir
    end

    def mirror_assets
      return unless has_assets_dir?

      destination = File.join(PluginLoader.public_directory, "#{@plugin_name}_-_#{Digest::UUID.uuid_v4}")

      source_files = Dir["#{assets_dir}/**/*"]
      source_dirs = source_files.select { |d| File.directory?(d) }
      source_files -= source_dirs
      unless source_files.empty?
        base_target_dir = File.join(destination, File.dirname(source_files.first).gsub(assets_dir, ""))
        begin
          FileUtils.mkdir_p(base_target_dir)
        rescue => e
          raise "Could not create directory #{base_target_dir}: " + e.message
        end
      end

      source_dirs.each do |dir|
        # strip down these paths so we have simple, relative paths we can
        # add to the destination
        target_dir = File.join(destination, dir.gsub(assets_dir, ""))
        begin
          FileUtils.mkdir_p(target_dir)
        rescue => e
          raise "Could not create directory #{target_dir}: " + e.message
        end
      end
      source_files.each do |file|
        target = File.join(destination, file.gsub(assets_dir, ""))
        FileUtils.cp(file, target) unless File.exist?(target) && FileUtils.identical?(file, target)
      rescue => e
        raise "Could not copy #{file} to #{target}: " + e.message
      end
    end

    def has_assets_dir?
      File.directory?(@assets_dir)
    end

    def has_initializer?
      File.file?(@initializer)
    end
  end

  class PluginLoader
    # Absolute path to the directory where plugins are located
    cattr_accessor :directory
    self.directory = Rails.root.join("plugins")

    # Absolute path to the plublic directory where plugins assets are copied
    cattr_accessor :public_directory
    self.public_directory = Rails.public_path.join("plugin_assets")

    def self.create_assets_reloader
      plugin_assets_dirs = {}
      directories.each do |dir|
        plugin_assets_dirs[dir.assets_dir] = ["*"]
      end
      ActiveSupport::FileUpdateChecker.new([], plugin_assets_dirs) do
        mirror_assets
      end
    end

    def self.db_load(p = nil)
      @plugin_directories = [] if @plugin_directories.nil?

      activated_plugins = p.nil? ? Plugin.where.not(activated_at: nil).to_a : [Plugin.new(p.as_json)]
      not_activated_plugins = Plugin.where(activated_at: nil).to_a

      activated_plugins.sort_by(&:id).each do |plugin|
        plugin_path = PluginPath.new(plugin.absolute_path, plugin.name)
        @plugin_directories << plugin_path

        routes = File.join plugin.absolute_path, "config", "routes.rb"

        Rails.application.routes.prepend do
          instance_eval File.read routes
        rescue StandardError => e
          path = File.basename(plugin.absolute_path)

          puts "An error occurred while loading the routes definition of '#{path.empty? ? plugin.name : path}' plugin (#{routes}): #{e.message}."
        end

        # Adds plugin locales if any
        # YAML translation files should be found under <plugin>/config/locales/
        Rails.application.config.i18n.load_path += Dir.glob(File.join(plugin.absolute_path, "config", "locales", "*.yml"))

        # Prepends the app/views directory of the plugin to the view path
        view_path = File.join(plugin.absolute_path, "app", "views")

        if File.directory?(view_path)
          unless ActionController::Base.view_paths.map(&:path).include? view_path
            ActionController::Base.prepend_view_path(view_path)
          end

          unless ActionMailer::Base.view_paths.map(&:path).include? view_path
            ActionMailer::Base.prepend_view_path(view_path)
          end
        end

        required_files = File.join plugin.absolute_path, "#{plugin.name}.rb"

        require required_files if File.exist? required_files

        # chargement de la config du plugin
        config_file = File.read(File.join(plugin.absolute_path, "config", "config.json"))
        config = JSON.parse(config_file)

        plugin.register_settings(config["settings"]) if plugin.configurable?

        all_modules = ObjectSpace.each_object(Module).reject { |m| m.is_a?(Class) }
        plugin_module = all_modules.find { |mod|  mod.to_s.include?(plugin.name.camelcase) }

        menus = if plugin_module && plugin_module.respond_to?(:menu_is_to_add?)
                  config["menus"].filter { |m| plugin_module.menu_is_to_add?(m) }
                else
                  config["menus"]
                end

        # configuration du plugin
        Plugin.register_menus(menus)

        plugin_path.run_initializer

        FileUtils.mkdir(PluginLoader.public_directory) unless Dir.exist?(PluginLoader.public_directory)

        Dir.each_child(PluginLoader.public_directory) do |dir|
          FileUtils.mv(File.join(PluginLoader.public_directory, dir), File.join(PluginLoader.public_directory, plugin.name)) if dir.start_with?("#{plugin.name}_-_")
        end

        EventHandler.plugins.loaded.trigger(
          sender: self.class.name,
          args: {
            id: plugin.id
          }
        )
      end

      not_activated_plugins.each do |plugin|
        dir = File.join(PluginLoader.public_directory, plugin.name)
        FileUtils.mv(dir, File.join(PluginLoader.public_directory, "#{plugin.name}_-_#{Digest::UUID.uuid_v4}")) if Dir.exist? dir
      end

      Rails.application.reload_routes!
    end

    # @return [Array<Elvis::PluginPath>]
    def self.directories
      @plugin_directories
    end

    # +mirror_assets+ copy selected plugin (or all) assets to rails assets directory.
    # @param [String] plugin
    def self.mirror_assets(plugin = nil)
      if plugin.present?
        PluginPath.new(`bundle show #{plugin}`.strip, plugin).mirror_assets
      else
        directories.each(&:mirror_assets)
      end
    end
  end
end

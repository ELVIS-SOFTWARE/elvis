# == Schema Information
#
# Table name: plugins
#
#  id                :integer          not null, primary key
#  name              :string(30)       default(""), not null
#  download_gem_link :string
#  created_at        :datetime
#  updated_at        :datetime
#  activated_at      :datetime
#  hidden            :boolean          default(FALSE), not null
#  display_name      :string
#  author            :string
#  description       :string
#  tag               :string
#  url               :string
#  author_url        :string
#  partial           :string
#
class Plugin < ApplicationRecord

  scope :visible, ->{ where(hidden: false) }

  @@used_partials = {}

  def self.display_class_name(singular = true)
    singular ? "plugin" : "plugins"
  end

  def self.class_name_gender
    return :M
  end


  def activated?
    activated_at.present?
  rescue StandardError
    false
  end

  # @return [String]
  def absolute_path
    @abs_path = `bundle show #{name}`.strip if @abs_path.nil?

    @abs_path
  end

  # @param [Plugin] plugin
  def update_description_fields(plugin)
    self.tag = plugin.tag
    self.download_gem_link = plugin.download_gem_link
    self.display_name = plugin.display_name
    self.description = plugin.description
    self.url = plugin.url
    self.author = plugin.author
    self.author_url = plugin.author_url
    self.partial = plugin.partial
    self.image = plugin.image
  end

  def register_settings(options = {})

    setting = Setting.find_or_create_by!(name: name) do |s|
      s.value = options["default"]
    end

    # Defines plugin setting if present
    Setting.define_plugin_setting(name, setting.value)

    # Warn for potential settings[:partial] collisions
    if options["partial"].present?
      partial = options["partial"]
      if @@used_partials[partial]
        Rails.logger.warn(
          "WARNING: settings partial '#{partial}' is declared in '#{name}' plugin " \
            "but it is already used by plugin '#{@@used_partials[partial]}'. " \
            "Only one settings view will be used. " \
            "You may want to contact those plugins authors to fix this."
        )
      end
      @@used_partials[partial] = name
    end

  end

  # @param [Array<Hash>] menus
  def self.register_menus(menus = [])
    menus.each do |m|
      Plugin.menu(m["menu"]&.to_sym || :side_menu, m["name"], m["display_name"], m["controller"], m["action"], m["options"])
    end
  end

  # Adds an item to the given +menu+.
  # The +id+ parameter (equals to the project id) is automatically added to the url.
  #   menu :project_menu, :plugin_example, { :controller => 'example', :action => 'say_hello' }, :caption => 'Sample'
  #
  # +name+ parameter can be: :top_menu, :account_menu, :application_menu or :project_menu
  # @param [String] caption
  # @param [String] controller
  # @param [String] action
  # @param [Hash] options
  def self.menu(menu, plugin, caption, controller, action, options = {})

    options ||= {}

    parent_sym = if options["parent"] == "root"
                   nil
                 elsif Elvis::MenuManager.find_item_by_name(menu, options["parent"]).nil?
                   :plugins
                 else
                   options["parent"].to_sym
                 end

    parent_menu = Elvis::MenuManager.find_item_by_name menu, parent_sym

    if parent_menu.nil? && parent_sym == :plugins
      parent_menu = Elvis::MenuManager::MenuItem.new(
        :plugins,
        "plugins",
        "",
        { caption: "Plugins", icon: "fa-puzzle-piece", user_role: "admin", position: 8 }
      )

      plugin_list = Elvis::MenuManager::MenuItem.new(
        :plugins_list,
        "plugins",
        "index",
        { caption: "Liste des plugins" }
      )

      parent_menu.add plugin_list
      Elvis::MenuManager.prepend_menu_item menu, parent_menu
    end

    options[:caption] = caption
    options[:user_role] = options["user_role"] || "admin"
    options[:icon] = options["icon"] || "fa-puzzle-piece" if parent_menu.nil?
    options[:position] = options["index"].is_a?(Integer) || options["index"].is_a?(Float) ? options["index"] : Elvis::MenuManager.menu_length(menu)
    options[:url] = options["url"] || ""

    plugin_menu_item = Elvis::MenuManager::MenuItem.new(
      plugin,
      controller,
      action,
      options
    )

    if parent_menu.nil?
      #Elvis::MenuManager.add_menu_item menu, plugin_menu_item if Elvis::MenuManager.find_item_by_name(menu, plugin).present?
      Elvis::MenuManager.add_menu_item menu, plugin_menu_item
    else
      parent_menu.add plugin_menu_item unless parent_menu.children.include?(plugin_menu_item)
    end
  end

  def configurable?
    partial.present?
  rescue StandardError
    false
  end

  # The directory containing this plugin's migrations (<tt>plugin/db/migrate</tt>)
  def migration_directory
    File.join(absolute_path, "db", "migrate")
  end

  # Returns the version number of the latest migration for this plugin. Returns
  # nil if this plugin has no migrations.
  def latest_migration
    migrations.last
  end

  # Returns the version numbers of all migrations for this plugin.
  def migrations
    migrations = Dir["#{migration_directory}/*.rb"]
    migrations.map { |p| File.basename(p).match(/0*(\d+)_/)[1].to_i }.sort
  end

  # Migrate this plugin to the given version
  def migrate(version = nil)
    Migrator.migrate_plugin(self, version)
  end

  # Migrate this plugin to the given version
  def rollback(version = nil)
    Migrator.rollback_plugin(self, version)
  end

  # Migrates all plugins or a single plugin to a given version
  # Exemples:
  #   Plugin.migrate
  #   Plugin.migrate('sample_plugin')
  #   Plugin.migrate('sample_plugin', 1)
  #
  def self.migrate(name = nil, version = nil)
    if name.present?
      Plugin.find_by(name: name).migrate(version)
    else
      Plugin.where.not(activated_at: nil).each(&:migrate)
    end
  end

  def self.rollback(name)
    if name.present?
      Plugin.find_by(name: name).rollback
    else
      pp "Error rollbacking plugin"
    end
  end

  class Migrator < ActiveRecord::Migrator
    # We need to be able to set the 'current' plugin being migrated.
    cattr_accessor :current_plugin

    class << self
      # Runs the migrations from a plugin, up (or down) to the version given
      def migrate_plugin(plugin, version)
        self.current_plugin = plugin
        return if current_version(plugin) == version

        MigrationContext.new(plugin.migration_directory,
                             ::ActiveRecord::Base.connection.schema_migration).migrate(version)
      end

      # Runs the migrations from a plugin, up (or down) to the version given
      def rollback_plugin(plugin, v = nil)
        self.current_plugin = plugin
        all_versions = get_all_versions
        # pp "all versions : ", @all_versions
        index = all_versions.index(v.nil? ? current_version(plugin) : v)
        # pp "index: ", index

        return if index.nil?

        version = all_versions[index]
        # pp "version cible : ", version
        context = MigrationContext.new(plugin.migration_directory,
                                       ::ActiveRecord::Base.connection.schema_migration)

        context.down version
        context.migrate(index.positive? ? all_versions[index - 1] : 0)
      end

      def get_all_versions(plugin = current_plugin)
        # pp "    --> plugin = ", plugin
        # Delete migrations that don't match .. to_i will work because the number comes first
        @all_versions ||= {}
        @all_versions[plugin.id.to_s] ||= begin
          sm_table = ::ActiveRecord::SchemaMigration.table_name
          migration_versions  = ActiveRecord::Base.connection.select_values("SELECT version FROM #{sm_table}")
          versions_by_plugins = migration_versions.group_by { |version| version.match(/-(.*)$/).try(:[], 1) }
          @all_versions       = versions_by_plugins.transform_values! { |versions| versions.map!(&:to_i).sort! }
          @all_versions[plugin.id.to_s] || []
        end
      end

      def current_version(plugin = current_plugin)
        get_all_versions(plugin).last || 0
      end
    end

    def load_migrated
      @migrated_versions = Set.new(self.class.get_all_versions(current_plugin))
    end

    def record_version_state_after_migrating(version)
      super("#{version}-#{current_plugin.id}")
    end
  end

  class MigrationContext < ActiveRecord::MigrationContext
    def up(target_version = nil, &block)
      selected_migrations =
        if block_given?
          migrations.select(&block)
        else
          migrations
        end
      Migrator.new(:up, selected_migrations, schema_migration, target_version).migrate
    end

    def down(target_version = nil, &block)
      selected_migrations =
        if block_given?
          migrations.select(&block)
        else
          migrations
        end
      Migrator.new(:down, selected_migrations, schema_migration, target_version).migrate
    end

    def run(direction, target_version)
      Migrator.new(direction, migrations, schema_migration, target_version).run
    end

    def open
      Migrator.new(:up, migrations, schema_migration)
    end
  end

  private_constant :Migrator
  private_constant :MigrationContext
end

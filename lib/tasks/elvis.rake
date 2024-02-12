# Redmine - project management software
# Copyright (C) 2006-2022  Jean-Philippe Lang
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
require_relative '../elvis/utils'

namespace :elvis do
  namespace :attachments do
    desc "Removes uploaded files left unattached after one day."
    task prune: :environment do
      Attachment.prune
    end

    desc "Moves attachments stored at the root of the file directory (ie. created before Redmine 2.3) to their subdirectories"
    task move_to_subdirectories: :environment do
      Attachment.move_from_root_to_target_directory
    end

    desc "Updates attachment digests to SHA256"
    task update_digests: :environment do
      Attachment.update_digests_to_sha256
    end
  end

  namespace :tokens do
    desc "Removes expired tokens."
    task prune: :environment do
      Token.destroy_expired
    end
  end

  namespace :users do
    desc "Removes registered users that have not been activated after a number of days. Use DAYS to set the number of days, defaults to 30 days."
    task prune: :environment do
      days = 30
      env_days = ENV["DAYS"]
      if env_days
        if env_days.to_i <= 0
          abort "Invalid DAYS #{env_days} given. The value must be a integer."
        else
          days = env_days.to_i
        end
      end
      User.prune(days.days)
    end
  end

  namespace :watchers do
    desc "Removes watchers from what they can no longer view."
    task prune: :environment do
      Watcher.prune
    end
  end

  task clean_big_tables: %i[environment] do
    table_to_clean = Parameter.get_value("app.clean_big_tables.tables_to_clean")&.split(",") || %w[event_store_events error_histories]
    logger = Logger.new(STDOUT)

    max_nb_lines = Parameter.get_value("app.clean_big_tables.max_nb_lines")&.to_i || 300_000

    table_to_clean.each do |table|
      logger.info "Verify #{table} table"

      begin
        nb_lines = ActiveRecord::Base.connection.execute("SELECT COUNT(*) FROM #{table}").first["count"].to_i

        if nb_lines > max_nb_lines
          logger.info "Cleaning #{table} table"

          ActiveRecord::Base.connection.execute("DELETE FROM #{table} WHERE id IN (SELECT id FROM #{table} ORDER BY id ASC LIMIT #{nb_lines - max_nb_lines})")
        else
          logger.info "No cleaning needed for #{table} table"
        end
      rescue StandardError => e
        logger.error "Error while cleaning #{table} table: #{e.message}"
      end
    end
  end

  namespace :plugins do

    task :logged do
      @logger = Logger.new(STDOUT)
    end

    desc 'Parse gemfile to save in db all gem with line marked with "#plugin"'
    task discover: %i[environment logged] do

      plugins = PluginGemUtils.get_plugins_installed(include_libraries: false)

      plugins.each do |plugin|
        database_plugin = Plugin.new

        database_plugin.name = plugin.name
        database_plugin.download_gem_link = plugin.full_url
        database_plugin.hidden = plugin.hidden
        database_plugin.tag = plugin.is_from_tag? ? plugin.tag : plugin.branch
        database_plugin.activated_at = plugin.auto_activate ? DateTime.now : nil

        config_file = File.read(File.join(database_plugin.absolute_path, "config", "config.json"))
        config = JSON.parse(config_file)

        database_plugin.display_name = config["display_name"]
        database_plugin.description = config["description"]
        database_plugin.url = config["url"]
        database_plugin.author = config["author"]
        database_plugin.author_url = config["author_url"]
        database_plugin.image = config["image"]
        database_plugin.partial = config["settings"]["partial"]

        if Plugin.exists? name: database_plugin.name
          # @type [Plugin]
          exist = Plugin.find_by(name: database_plugin.name)

          exist.update_description_fields database_plugin

          # reset the activated_at value only if plugin is currently hidden && currently unactivated
          exist.activated_at = database_plugin.activated_at if exist.activated_at.nil? && exist.hidden
          exist.updated_at = DateTime.now

          exist.save
        else
          database_plugin.save
        end

      rescue StandardError => e
        @logger.error "#{e}\n#{e.backtrace&.join("\n")}"
      end
    end

    task :copy_react do

      plugins = PluginGemUtils.get_plugins_installed(include_libraries: false)

      def self.cpf(file, dest)
        if Dir.exist? file
          dir_path = "#{dest}/#{file.split('/').last}"

          Dir.mkdir dir_path unless Dir.exist? dir_path

          Dir.each_child(file) do |tmp|
            cpf "#{file}/#{tmp}", dir_path
          end
        elsif File.exist? file
          f = File.open file, "r+"
          fdest = File.open "#{dest}/#{file.split('/').last}", "w"

          f.readlines.each { |line| fdest.write "#{line}" }

          f.close
          fdest.close
        end
      end

      plugins.each do |plugin|
        frontend_path = "./frontend/components/plugins/#{plugin.name}"

        FileUtils.makedirs frontend_path unless Dir.exist? frontend_path

        react_path = File.join plugin.installed_path, "react_component"

        pp "copy react files for #{plugin.name} plugin"
        Dir.exist?(react_path) && Dir.each_child(react_path) do |tmp|
          cpf File.join(react_path, tmp), frontend_path
        end
      rescue StandardError => e
        pp "copy error: #{e}"
      end
    end

    task :npm_dependencies do
      logger = Logger.new(STDOUT)

      npm_dependencies = []

      PluginGemUtils.get_plugins_installed(include_libraries: false).each do |plugin|
        dependency_file = File.join plugin.installed_path, "react_dependencies"

        if File.exist?(dependency_file)
          depencies = File.readlines dependency_file

          depencies.each { |dep| npm_dependencies << dep.strip }
        end
      rescue StandardError => e
        logger.error "#{e}\n#{e.backtrace&.join("\n")}"
      end

      puts npm_dependencies.join(" ")
    end

    task :install_npm_dependencies do
      # Méthode pour capturer la sortie standard


      dependencies = capture_stdout { Rake::Task["elvis:plugins:npm_dependencies"].execute }

      if "#{dependencies}".strip.empty?
        puts "No dependencies to install"
      else
        puts "Installing dependencies: #{dependencies}"

        `yarn add #{dependencies}`
      end
    end

    task :generate_pluginjson_from_url do
      if "#{ENV['PLUGINS_LIST_DOWNLOAD_URL']}".empty?
        raise "PLUGINS_LIST_DOWNLOAD_URL is empty"
      end

      puts "Downloading plugins list from #{ENV['PLUGINS_LIST_DOWNLOAD_URL']}"

      plugins_from_internet = PluginGemUtils.get_plugins_to_install(include_libraries: true)

      plugins = plugins_from_internet.map {|p| p.as_json.deep_transform_keys{|k| k.camelize(:lower) }.except(:id, :installed_path)}

      puts "Writing plugins list to plugins.json"

      File.open("plugins.json", "w") do |f|
        f.write(plugins.to_json)
      end

      puts "Plugins list written to plugins.json"
    end

    desc "Migrates installed plugins."
    task migrate: %i[environment logged] do |_, args|
      params = args.to_a

      name = params.length.positive? ? params[0] : nil
      version_string = params.length > 1 ? params[1] : nil

      version = nil
      if version_string
        if version_string =~ /^\d+$/
          version = version_string.to_i
          abort "The VERSION argument requires a plugin NAME." if name.nil?
        else
          abort "Invalid VERSION #{version_string} given."
        end
      end

      begin
        Plugin.migrate(name, version)
      rescue StandardError => e
        @logger.error "#{e}\n#{e.backtrace.join("\n")}"
        abort "Error migrating plugin #{name}."
      end

      case ActiveRecord::Base.schema_format
      when :ruby
        Rake::Task["db:schema:dump"].invoke
      when :sql
        Rake::Task["db:structure:dump"].invoke
      end
    end

    desc "Rollback migration for specific plugin."
    task rollback: %i[environment logged] do |_, args|
      name = args.to_a[0]

      begin
        Plugin.rollback(name)
      rescue StandardError => e
        @logger.error "#{e}\n#{e.backtrace.join("\n")}"
        abort "Error rollbacking plugin #{name}."
      end

      case ActiveRecord::Base.schema_format
      when :ruby
        Rake::Task["db:schema:dump"].invoke
      when :sql
        Rake::Task["db:structure:dump"].invoke
      end
    end

    desc "Copies plugins assets into the public directory."
    task assets: %i[logged] do
      require_relative "../elvis/plugin_loader"

      FileUtils.remove_dir Elvis::PluginLoader.public_directory if Dir.exist? Elvis::PluginLoader.public_directory

      PluginGemUtils.get_plugins_installed(include_libraries: false).each do |plugin|
        Elvis::PluginLoader.mirror_assets(plugin.name)

      rescue StandardError => e
        @logger.error "#{e}\n#{e.backtrace&.join("\n")}"
        abort "Error copying assets for plugin #{name}."
      end
    end

    desc "Runs the plugins tests."
    task :test do
      Rake::Task["redmine:plugins:test:units"].invoke
      Rake::Task["redmine:plugins:test:functionals"].invoke
      Rake::Task["redmine:plugins:test:integration"].invoke
      Rake::Task["redmine:plugins:test:system"].invoke
    end

    namespace :test do
      desc "Runs the plugins unit tests."
      task units: "db:test:prepare" do |_t|
        $: << "test"
        Rails::TestUnit::Runner.rake_run ["plugins/#{ENV['NAME'] || '*'}/test/unit/**/*_test.rb"]
      end

      desc "Runs the plugins functional tests."
      task functionals: "db:test:prepare" do |_t|
        $: << "test"
        Rails::TestUnit::Runner.rake_run ["plugins/#{ENV['NAME'] || '*'}/test/functional/**/*_test.rb"]
      end

      desc "Runs the plugins integration tests."
      task integration: "db:test:prepare" do |_t|
        $: << "test"
        Rails::TestUnit::Runner.rake_run ["plugins/#{ENV['NAME'] || '*'}/test/integration/**/*_test.rb"]
      end

      desc "Runs the plugins system tests."
      task system: "db:test:prepare" do |_t|
        $: << "test"
        Rails::TestUnit::Runner.rake_run ["plugins/#{ENV['NAME'] || '*'}/test/system/**/*_test.rb"]
      end

      desc "Runs the plugins ui tests."
      task ui: "db:test:prepare" do |_t|
        $: << "test"
        Rails::TestUnit::Runner.rake_run ["plugins/#{ENV['NAME'] || '*'}/test/ui/**/*_test.rb"]
      end
    end
  end
end

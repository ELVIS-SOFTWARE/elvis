module Elvis

  module MenuManager
    @@menus

    # @param [Symbol] menu
    # @param [Elvis::MenuManager::MenuItem] menu_item
    def self.add_menu_item(menu, menu_item, options = {})
      items = get_menu(menu)

      throw StandardError.new "#{menu} menu doesn't exist" if items.nil?

      items.push menu_item if !items.nil? && !items.include?(menu_item)
    end

    # @param [Symbol] menu
    # @param [Elvis::MenuManager::MenuItem] menu_item
    def self.prepend_menu_item(menu, menu_item, options = {})
      items = get_menu(menu)

      throw StandardError.new "#{menu} menu doesn't exist" if items.nil?

      items.prepend menu_item if !items.nil? && !items.include?(menu_item)
    end

    # @param [Symbol] menu
    # @param [Elvis::MenuManager::MenuItem] menu_item
    def self.insert_menu_item(menu, menu_item, index = -1, options = {})
      return prepend_menu_item(menu, menu_item) if index.negative?
      return add_menu_item(menu, menu_item) if index >= menu_length(menu)

      items = get_menu(menu)

      throw StandardError.new "#{menu} menu doesn't exist" if items.nil?

      items.insert index, menu_item if !items.nil? && !items.include?(menu_item)
    end

    # @param [Symbol] menu
    # @param [String] role
    # @return [Array<Elvis::MenuManager::MenuItem>]
    def self.get_menu_with_role(menu, role)
      get_menu(menu)&.select { |item| role.blank? || "#{item.user_role}".include?(role) || item.user_role.blank? }&.sort_by(&:position) || []
    end

    def self.get_menu_with_roles(menu, roles)
      get_menu(menu)&.map{|i| i.dup}&.select do |item|

        item.instance_variable_set "@children", item.children.dup

        item.each do |child|
          unless menu_is_allowed?(roles, child.user_role)
            item.remove!(child)
          end
        end

        item.user_role.blank? || menu_is_allowed?(roles, item.user_role)
      end
        &.sort_by(&:position) || []
    end

    def self.menu_is_allowed?(roles, user_role)
      return true if user_role.blank?

      if user_role.start_with? "!!"
        return false if roles.length != 1

        return roles[0] == user_role[2..]
      end

      return roles.include?(user_role)
    end

    # search plugin item in all menu
    def self.plugin_item?
      all_menus = menus

      all_menus.any? { |_, value| value.any? { |i| i.name == :plugins } }
    end

    # return true if all menus are empty, false otherwise
    def self.menus_items?
      menus.empty? || menus.all? { |m| m[1].empty? }
    end

    # @param [Symbol] menu
    # @param [Symbol, String] name
    def self.find_item_by_name(menu, name)
      items = get_menu(menu)

      items&.find { |m| m.name.to_s == name&.to_s }
    end

    # @param [Symbol] menu
    def self.menu_length(menu)
      items = get_menu(menu)

      items&.length || 0
    end

    # @param [Symbol] menu_key
    # @return [Array<Elvis::MenuManager::MenuItem>]
    def self.get_menu(menu_key)
      return menus[menu_key] if menus.key?(menu_key)

      nil
    end

    # @param [Symbol] menu_key
    # @return [Array<Elvis::MenuManager::MenuItem>]
    def self.get_or_create_menu(menu_key)
      menu = menus[menu_key]

      menus[menu_key] = menu = [] if menu.nil?

      menu
    end

    # @return [Hash{Symbol=>Array<Elvis::MenuManager::MenuItem>}]
    def self.menus
      @@menus ||= {}

      @@menus
    end

    # @param [Symbol] menu_key
    def self.add_menu(menu_key)
      menus[menu_key] = [] unless menus.key?(menu_key)
    end

    def self.clear_menus
      @@menus = {}
    end

    class MenuNode
      include Enumerable
      attr_accessor :parent
      attr_reader :last_items_count, :name

      def initialize(name, content = nil)
        @name = name
        @children = []
        @last_items_count = 0
      end

      def children
        if block_given?
          @children.sort_by(&:position).each { |child| yield child }
        else
          @children.sort_by(&:position)
        end
      end

      # Returns the number of descendants + 1
      def size
        @children.inject(1) { |sum, node| sum + node.size }
      end

      def each(&block)
        children do |child|
          yield child

          child.each(&block)
        end
      end

      # Adds a child at first position
      def prepend(child)
        add_at(child, 0)
      end

      # Adds a child at given position
      def add_at(child, position)
        raise "Child already added" if find { |node| node.name == child.name }

        @children = @children.insert(position, child)
        child.parent = self
        child
      end

      # Adds a child as last child
      def add_last(child)
        add_at(child, -1)
        @last_items_count += 1
        child
      end

      # Adds a child
      def add(child)
        position = @children.size - @last_items_count
        add_at(child, position)
      end
      alias :<< :add

      # Removes a child
      def remove!(child)
        @children.delete(child)
        @last_items_count -= +1 if child && child.last
        child.parent = nil
        child
      end

      # Returns the position for this node in it's parent
      def position
        self.parent.children.index(self)
      end

      # Returns the root for this node
      def root
        root = self
        root = root.parent while root.parent
        root
      end
    end

    class MenuItem < MenuNode
      # include Redmine::I18n
      attr_reader :name, :url, :param, :route_params, :condition, :parent,
      :child_menus, :last, :permission, :action, :controller, :position, :a_options

      include Rails.application.routes.url_helpers

      # @param [Proc<Hash>] route_params executed to get routes params. Block is executed with instance_eval in PluginManager by default, otherwise in object in url method params
      def initialize(name, controller, action, options={}, &route_params)
        if options[:if] && !options[:if].respond_to?(:call)
          raise ArgumentError, "Invalid option :if for menu item '#{name}'"
        end
        if options[:html] && !options[:html].is_a?(Hash)
          raise ArgumentError, "Invalid option :html for menu item '#{name}'"
        end
        if options[:parent] == name.to_sym
          raise ArgumentError, "Cannot set the :parent to be the same as this item"
        end
        if options[:children] && !options[:children].respond_to?(:call)
          raise ArgumentError, "Invalid option :children for menu item '#{name}'"
        end

        @name = name
        # modifié par Xavier
        @controller = controller
        @action = action
        @icon = options[:icon]
        @url = options[:url] if options[:url].present?
        # fin modifié par Xavier
        @condition = options[:if]
        @permission = options[:permission]
        @permission ||= false if options.key?(:permission)
        @param = options[:param] || :id
        @route_params = route_params
        @caption = options[:caption]
        @user_role = options[:user_role]
        @a_options = options[:a_options] ||{}
        @html_options = options[:html] || {}
        # Adds a unique class to each menu item based on its name
        @html_options[:class] = [@html_options[:class], @name.to_s.dasherize].compact.join(" ")
        @parent = options[:parent]
        @child_menus = options[:children]
        @last = options[:last] || false
        @position = options[:position] || Elvis::MenuManager.menu_length(:side_menu)

        super @name.to_sym
      end

      def url(obj = self)
        return @url unless @url.nil?

        url_parameters = { action: @action, controller: @controller, only_path: true }
        url_parameters = url_parameters.merge(obj.instance_eval(&@route_params)) unless @route_params.nil?

        # return ActionView::RoutingUrlFor.url_for(action: action, controller: controller)
        url_for(url_parameters)

      end

      def icon
        return @icon unless @icon.nil?
      end

      def user_role
        return @user_role unless @user_role.nil?
      end

      def position
        return @position unless @position.nil?
      end

      def caption(project=nil)
        if @caption.is_a?(Proc)
          c = @caption.call(project).to_s
          c = @name.to_s.humanize if c.blank?
          c
        else
          if @caption.nil?
            name
          else
            @caption.is_a?(Symbol) ? l(@caption) : @caption
      end
        end
      end

      def html_options(options={})
        if options[:selected]
          o = @html_options.dup
          o[:class] += " selected"
          o
        else
          @html_options
        end
      end

      # Checks if a user is allowed to access the menu item by:
      #
      # * Checking the permission or the url target (project only)
      # * Checking the conditions of the item
      def allowed?(user, project)
        if url.blank?
          # this is a virtual node that is only there for its children to be diplayed in the menu
          # it is considered an allowed node if at least one of the children is allowed
          all_children = children
          all_children += child_menus.call(project) if child_menus
          unless all_children.detect{ |child| child.allowed?(user, project) }
            return false
          end
        elsif user && project
          if permission
            unless user.allowed_to?(permission, project)
              return false
            end
          elsif permission.nil? && url.is_a?(Hash)
            unless user.allowed_to?(url, project)
              return false
            end
          end
        end
        if condition && !condition.call(project)
          # Condition that doesn't pass
          return false
        end

        true
      end

      def ==(other)
        return false unless other.class == MenuItem

        @name == other.name && @controller == other.controller && @action == other.action
      end
    end
  end
end

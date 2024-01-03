class AddFieldsToPlugin < ActiveRecord::Migration[6.1]
  def up
        add_column :plugins, :display_name, :string
        add_column :plugins, :author, :string
        add_column :plugins, :description, :string
        add_column :plugins, :branch, :string
        add_column :plugins, :url, :string
        add_column :plugins, :author_url, :string
        add_column :plugins, :partial, :string
    end
    def down
        remove_column :plugins, :display_name
        remove_column :plugins, :author
        remove_column :plugins, :description
        remove_column :plugins, :branch
        remove_column :plugins, :url
        remove_column :plugins, :author_url
        remove_column :plugins, :partial
  end
end

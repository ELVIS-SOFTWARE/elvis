class CreateApplicationUrls < ActiveRecord::Migration[6.1]
  def change
    create_table :application_urls do |t|
      t.string :url
      t.boolean :is_main, null: false, default: false
      t.datetime :last_used_at
    end
  end
end

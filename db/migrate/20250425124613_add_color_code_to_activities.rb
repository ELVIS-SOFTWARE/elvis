class AddColorCodeToActivities < ActiveRecord::Migration[6.1]
  def change
    add_column :activity_refs, :color_code, :string, default: nil
  end
end

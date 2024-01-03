class AddAllowsTimeslotSelectionToActivityRef < ActiveRecord::Migration[6.1]
  def self.up
    add_column :activity_refs, :allows_timeslot_selection, :boolean, default: false
  end

  def self.down
    remove_column :activity_refs, :allows_timeslot_selection
    end
end

class AddNbLessonsToActivityRef < ActiveRecord::Migration[6.1]
  def self.up
    add_column :activity_refs, :nb_lessons, :integer
  end
  def self.down
    remove_column :activity_refs, :nb_lessons
  end
end

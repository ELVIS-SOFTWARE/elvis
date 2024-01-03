class AddDateForTeacherPlanningValidationToSeasons < ActiveRecord::Migration[6.1]
  def change
    add_column :seasons, :date_for_teacher_planning_validation, :datetime
  end
end

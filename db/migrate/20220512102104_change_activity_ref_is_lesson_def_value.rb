class ChangeActivityRefIsLessonDefValue < ActiveRecord::Migration[6.1]
  def change
    change_column_default :activity_refs, :is_lesson, true
  end
end

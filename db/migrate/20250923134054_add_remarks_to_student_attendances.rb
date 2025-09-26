class AddRemarksToStudentAttendances < ActiveRecord::Migration[6.1]
  def change
    add_column :student_attendances, :remarks, :text
  end
end

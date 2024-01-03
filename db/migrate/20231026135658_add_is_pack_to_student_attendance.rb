class AddIsPackToStudentAttendance < ActiveRecord::Migration[6.1]
  def change
    add_column :student_attendances, :is_pack, :boolean, default: false
  end
end

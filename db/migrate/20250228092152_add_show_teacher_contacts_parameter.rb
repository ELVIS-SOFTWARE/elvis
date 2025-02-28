class AddShowTeacherContactsParameter < ActiveRecord::Migration[6.1]
  def up
    param = Parameter.find_or_initialize_by(label: "teachers.show_teacher_contacts")
    param.value = "true"
    param.value_type = "boolean"
    param.save!
  end

  def down
    Parameter.where(label: "teachers.show_teacher_contacts").destroy_all
  end
end

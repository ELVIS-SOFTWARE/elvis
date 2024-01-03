# == Schema Information
#
# Table name: student_attendances
#
#  id                   :bigint           not null, primary key
#  user_id              :bigint
#  activity_instance_id :bigint
#  attended             :integer
#  comment              :text
#  is_option            :boolean          default(FALSE)
#

class StudentAttendanceSerializer < ActiveModel::Serializer
    attributes :id, :user_id, :activity_instance_id, :attended
end

# == Schema Information
#
# Table name: activity_instances
#
#  id                :bigint           not null, primary key
#  time_interval_id  :bigint
#  room_id           :bigint
#  location_id       :bigint
#  activity_id       :bigint
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  cover_teacher_id  :bigint
#  are_hours_counted :boolean          default(TRUE)
#

class ActivityInstanceSerializer < ActiveModel::Serializer
  # include FastJsonapi::ObjectSerializer
  belongs_to :activity
  has_many :student_attendances

  attributes :id
end

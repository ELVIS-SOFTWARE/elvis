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

class StudentAttendance < ApplicationRecord
    belongs_to :user, required: true
    belongs_to :activity_instance, required: true

    def self.display_class_name(singular=false)
        singular ? "inscription aux séances" : "inscriptions aux séances"
    end

    def self.class_name_gender
        return :F
    end


end

# == Schema Information
#
# Table name: desired_teachers
#
#  id                      :bigint           not null, primary key
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  activity_application_id :bigint
#  user_id                 :bigint
#

class DesiredTeacher < ApplicationRecord
    belongs_to :user
    belongs_to :activity_application

    def self.display_class_name(singular = true)
        singular ? "professeur souhaité" : "professeurs souhaités"
    end

    def self.class_name_gender
        return :M
    end

end

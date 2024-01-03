# == Schema Information
#
# Table name: teachers_activity_instances
#
#  id                   :bigint           not null, primary key
#  user_id              :bigint           not null
#  activity_instance_id :bigint           not null
#  is_main              :boolean
#

class TeachersActivityInstance < ApplicationRecord
    belongs_to :teacher, -> {where(is_teacher: true)}, class_name: :User, foreign_key: :user_id
    belongs_to :activity_instance

    def self.display_class_name(singular = true)
        singular ? "séance de cours de professeur" : "séances de cours des professeurs"
    end

    def self.class_name_gender
        return :F
    end

end

# == Schema Information
#
# Table name: teachers_activities
#
#  user_id     :bigint           not null
#  activity_id :bigint           not null
#  is_main     :boolean
#

class TeachersActivity < ApplicationRecord
    belongs_to :teacher, class_name: :User, foreign_key: :user_id
    belongs_to :activity

    # define user_id and activity_id as primary key
    self.primary_keys = :user_id, :activity_id

    def self.display_class_name(singular = true)
        singular ? "cours de professeur" : "cours de professeurs"
    end

    def self.class_name_gender
        return :M
    end

end

# == Schema Information
#
# Table name: teachers_activity_refs
#
#  id              :bigint           not null, primary key
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  activity_ref_id :bigint
#  user_id         :bigint
#

class TeachersActivityRef < ApplicationRecord
    belongs_to :activity_ref
    belongs_to :user

    def self.display_class_name(singular = true)
        singular ? "activité de professeur" : "activités des professeurs"
    end

    def self.class_name_gender
        return :F
    end

end

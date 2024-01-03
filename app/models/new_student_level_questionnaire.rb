# == Schema Information
#
# Table name: new_student_level_questionnaires
#
#  id              :bigint           not null, primary key
#  user_id         :bigint
#  season_id       :bigint
#  activity_ref_id :bigint
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#

class NewStudentLevelQuestionnaire < ApplicationRecord
    belongs_to :user

    belongs_to :activity_ref
    belongs_to :season

    has_many :answers, as: :answerable, dependent: :destroy

    def self.display_class_name(singular = true)
        singular ? "questionnaire de niveau pour nouvel élève" : "questionnaires de niveau pour nouvel élève"
    end

    def self.class_name_gender
        return :M
    end

end

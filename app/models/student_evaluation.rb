# == Schema Information
#
# Table name: student_evaluations
#
#  id          :bigint           not null, primary key
#  activity_id :bigint
#  teacher_id  :bigint
#  student_id  :bigint
#  season_id   :bigint
#

class StudentEvaluation < ApplicationRecord
    belongs_to :teacher, class_name: :User, foreign_key: :teacher_id
    belongs_to :student, class_name: :User, foreign_key: :student_id

    belongs_to :activity
    belongs_to :season

    has_many :answers, as: :answerable, dependent: :destroy

    def self.display_class_name(singular = true)
        singular ? "évaluation d'élève" : "évaluations d'élèves"
    end

    def self.class_name_gender
        return :F
    end

end

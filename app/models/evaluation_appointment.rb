# == Schema Information
#
# Table name: evaluation_appointments
#
#  id                      :bigint           not null, primary key
#  student_id              :bigint
#  teacher_id              :bigint
#  time_interval_id        :bigint
#  season_id               :bigint
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  activity_ref_id         :bigint
#  activity_application_id :bigint
#  room_id                 :bigint
#

class EvaluationAppointment < ApplicationRecord
    belongs_to :season
    belongs_to :time_interval, required: false
    
    belongs_to :teacher, class_name: :User, required: false

    belongs_to :room, required: false
    belongs_to :activity_ref

    belongs_to :student, class_name: :User, required: false
    belongs_to :activity_application, required: false

    scope :incomplete, ->{ where(student_id: nil, activity_application_id: nil) }
    scope :in_season, ->(season){ where(season_id: season.id) }

    def self.display_class_name(singular = true)
        singular ? "RDV d'évaluation" : "RDV d'évaluation"
    end

    def self.class_name_gender
        return :M
    end

end

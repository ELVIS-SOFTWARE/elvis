# == Schema Information
#
# Table name: teacher_seasons
#
#  id        :bigint           not null, primary key
#  season_id :bigint           not null
#  user_id   :bigint           not null
#

# /!\ ........................................................ /!\
#       DEPRECATED : plus utilisée
# /!\ ........................................................ /!\

class TeacherSeason < ApplicationRecord
    belongs_to :teacher, -> {where(is_teacher: true)}, class_name: :User, foreign_key: :user_id, required: true
    belongs_to :season, required: true

    def self.display_class_name(singular = true)
        singular ? "association professeur / saison" : "associations professeurs / saisons"
    end

    def self.class_name_gender
        return :F
    end

end

# == Schema Information
#
# Table name: evaluation_level_refs
#
#  id           :bigint           not null, primary key
#  value        :integer
#  label        :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  can_continue :boolean          default(FALSE)
#

class EvaluationLevelRef < ApplicationRecord
    has_many :levels

    def self.display_class_name(singular = true)
        singular ? "référentiel d'évaluation" : "référentiels d'évaluation"
    end

    def self.class_name_gender
        return :M
    end

end

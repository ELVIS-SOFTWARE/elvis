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
    extend Elvis::ConstantLike

    has_many :levels

    DEFAULT_LEVEL_REF_ID = 1
    DEFAULT_LEVEL_REF = find_or_create_by!(id: DEFAULT_LEVEL_REF_ID, label: 'DEBUTANT', value: 0, can_continue: false)

    def self.display_class_name(singular = true)
        singular ? "référentiel d'évaluation" : "référentiels d'évaluation"
    end

    def self.class_name_gender
        return :M
    end

end

# == Schema Information
#
# Table name: planning_conflicts
#
#  id          :bigint           not null, primary key
#  planning_id :bigint
#  conflict_id :bigint
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#

class PlanningConflict < ApplicationRecord
  belongs_to :planning
  belongs_to :conflict

  def self.display_class_name(singular = true)
    singular ? "conflit de planning" : "conflit de planning"
  end

  def self.class_name_gender
    return :M
  end

end

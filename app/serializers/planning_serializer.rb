# == Schema Information
#
# Table name: plannings
#
#  id          :bigint           not null, primary key
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  user_id     :bigint
#  hours_count :float            default(0.0)
#  is_locked   :boolean          default(FALSE)
#

class PlanningSerializer < ActiveModel::Serializer
  # include FastJsonapi::ObjectSerializer
  belongs_to :user
  has_many :conflicts

  attributes :id, :is_locked
end
